import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';

// --- Inicialización ---
dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.API_KEY) {
    throw new Error("API_KEY no está definida en las variables de entorno");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Límite aumentado para imágenes de firma

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos PDF estáticamente
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));


// --- Funciones Auxiliares ---
const calculateAge = (dateOfBirth: string | Date): number => {
    const dob = new Date(dateOfBirth);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
};

const isActionRequired = (patient: any): boolean => {
    if (!patient.surgeryDateTime || patient.isArchived) return false;
    
    const surgeryDate = new Date(patient.surgeryDateTime);
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    const needsSurgicalSignature = !patient.surgicalSignatureImage;
    const needsAnesthesiaSignature = patient.anesthesiaConsentPDFName && !patient.anesthesiaSignatureImage;

    return surgeryDate <= twoDaysFromNow && (needsSurgicalSignature || needsAnesthesiaSignature);
}

const processPatient = (patient: any) => {
    if (!patient) return null;
    const age = calculateAge(patient.dateOfBirth);
    const isArchived = patient.surgeryDateTime ? new Date(patient.surgeryDateTime) < new Date() : false;
    const actionRequired = isActionRequired({ ...patient, isArchived });
    return { ...patient, age, isActionRequired, isArchived };
};


// --- Rutas de la API ---

// GET /api/consent-forms?type=...
app.get('/api/consent-forms', async (req: express.Request, res: express.Response) => {
    const type = req.query.type as string;
    if (!['surgical', 'anesthesia'].includes(type)) {
        return res.status(400).json({ message: 'Tipo de consentimiento inválido.' });
    }

    try {
        const directoryPath = path.join(uploadsDir, type);
        const files = await fs.readdir(directoryPath);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
        res.json(pdfFiles);
    } catch (err: any) {
        console.error(`Error leyendo directorio para el tipo ${type}:`, err);
        if (err.code === 'ENOENT') {
            return res.json([]);
        }
        res.status(500).json({ message: 'No se pudieron recuperar los formularios de consentimiento.' });
    }
});


// POST /api/surgeons/login y /api/anesthesiologists/login
const handleProfessionalLogin = async (req: express.Request, res: express.Response, model: 'surgeon' | 'anesthesiologist') => {
    const { professionalLicenseNumber, password } = req.body;
    try {
        // @ts-ignore
        const professional = await prisma[model].findUnique({ where: { professionalLicenseNumber } });
        if (professional && professional.password === password) {
            const { password: _, ...professionalData } = professional;
            res.json(professionalData);
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

app.post('/api/surgeons/login', (req: express.Request, res: express.Response) => handleProfessionalLogin(req, res, 'surgeon'));
app.post('/api/anesthesiologists/login', (req: express.Request, res: express.Response) => handleProfessionalLogin(req, res, 'anesthesiologist'));


// POST /api/login (patient)
app.post('/api/login', async (req: express.Request, res: express.Response) => {
    const { email, cedula } = req.body;
    try {
        const patient = await prisma.patient.findUnique({ 
            where: { email },
            include: { surgeon: true, anesthesiologist: true }
        });
        if (patient && patient.cedula === cedula) {
            res.json(processPatient(patient));
        } else {
            res.status(401).json({ message: 'Credenciales inválidas.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error de conexión.' });
    }
});


// GET /api/patients
app.get('/api/patients', async (req: express.Request, res: express.Response) => {
    try {
        const patients = await prisma.patient.findMany({
            include: { surgeon: true, anesthesiologist: true },
            orderBy: { surgeryDateTime: 'desc' },
        });
        res.json(patients.map(processPatient));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los pacientes' });
    }
});

// POST /api/patients
app.post('/api/patients', async (req: express.Request, res: express.Response) => {
    const { firstName, lastName, email, cedula, dateOfBirth, sex, consentPDFName, surgicalProcedure, surgeryDateTime, surgeonId } = req.body;
    try {
        const newPatient = await prisma.patient.create({
            data: {
                firstName, lastName, email, cedula, dateOfBirth, sex,
                surgicalConsentPDFName: consentPDFName,
                surgicalProcedure, surgeryDateTime,
                surgeon: { connect: { id: surgeonId } },
            },
            include: { surgeon: true, anesthesiologist: true }
        });
        res.status(201).json(processPatient(newPatient));
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Ya existe un paciente con ese correo o cédula.' });
        }
        res.status(500).json({ message: 'Error al crear el paciente' });
    }
});

// PUT /api/patients/:patientId/anesthesia-consent
app.put('/api/patients/:patientId/anesthesia-consent', async (req: express.Request, res: express.Response) => {
    const { patientId } = req.params;
    const { consentPDFName, instructions, fastingInstructions, medicationToSuspend, anesthesiologistId } = req.body;
    try {
        const updatedPatient = await prisma.patient.update({
            where: { id: patientId },
            data: {
                anesthesiaConsentPDFName: consentPDFName,
                anesthesiaInstructions: instructions,
                fastingInstructions: fastingInstructions,
                medicationToSuspend: medicationToSuspend,
                anesthesiologist: { connect: { id: anesthesiologistId } }
            },
            include: { surgeon: true, anesthesiologist: true }
        });
        res.json(processPatient(updatedPatient));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al añadir el consentimiento de anestesia' });
    }
});

// PUT /api/patients/:patientId/sign-surgical | sign-anesthesia
const handleSignConsent = async (req: express.Request, res: express.Response, type: 'surgical' | 'anesthesia') => {
    const { patientId } = req.params;
    const { signatureImage } = req.body;
    try {
        const dataToUpdate = type === 'surgical' 
            ? { surgicalSignatureImage: signatureImage, surgicalSignedDate: new Date().toISOString() }
            : { anesthesiaSignatureImage: signatureImage, anesthesiaSignedDate: new Date().toISOString() };

        const updatedPatient = await prisma.patient.update({
            where: { id: patientId },
            data: dataToUpdate,
            include: { surgeon: true, anesthesiologist: true }
        });
        res.json(processPatient(updatedPatient));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al firmar el consentimiento' });
    }
};

app.put('/api/patients/:patientId/sign-surgical', (req: express.Request, res: express.Response) => handleSignConsent(req, res, 'surgical'));
app.put('/api/patients/:patientId/sign-anesthesia', (req: express.Request, res: express.Response) => handleSignConsent(req, res, 'anesthesia'));


// POST /api/ai/generate-medication-instructions
app.post('/api/ai/generate-medication-instructions', async (req: express.Request, res: express.Response) => {
    const { medications, surgicalProcedure } = req.body;
    if (!medications || !surgicalProcedure) {
        return res.status(400).json({ message: "Se requiere la medicación y el procedimiento quirúrgico." });
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Un paciente que toma los siguientes medicamentos: "${medications}" será sometido a una cirugía de "${surgicalProcedure}". Genera instrucciones claras en español para el paciente sobre qué medicamentos suspender y cuándo.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        instructionsText: {
                            type: Type.STRING,
                            description: "Un texto claro y conciso dirigido al paciente explicando las suspensiones de medicamentos, el motivo y cuándo reanudarlos."
                        },
                        medicationsToSuspend: {
                            type: Type.ARRAY,
                            description: "Una lista de strings, donde cada string es un medicamento a suspender seguido del tiempo de suspensión. Ejemplo: ['Aspirina - suspender 7 días antes', 'Metformina - no tomar el día de la cirugía']",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["instructionsText", "medicationsToSuspend"]
                }
            }
        });
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "Error al generar instrucciones con IA." });
    }
});

// --- Arranque del Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});