import express, { type Request, type Response, type NextFunction, type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { PrismaClient, type Patient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import * as babel from '@babel/core';


// --- Inicialización ---
dotenv.config();

// Validar variables de entorno
if (!process.env.DATABASE_URL) {
    console.error("Error: La variable de entorno DATABASE_URL no está definida.");
    console.error("Por favor, cree un archivo '.env' en el directorio 'backend/' y añada su DATABASE_URL.");
    console.error("Puede copiar 'backend/.env.example' a '.env' y rellenar los valores.");
    console.error("Consulte backend/README.md para más detalles.");
    (process as any).exit(1);
}

if (!process.env.API_KEY) {
    console.error("Error: La variable de entorno API_KEY no está definida.");
    console.error("Por favor, cree un archivo '.env' en el directorio 'backend/' y añada su API_KEY.");
    console.error("Puede copiar 'backend/.env.example' a '.env' y rellenar los valores.");
    console.error("Consulte backend/README.md para más detalles.");
    (process as any).exit(1);
}

const prisma = new PrismaClient();
const app: Express = express();
const PORT = process.env.PORT || 4000;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Límite aumentado para imágenes de firma

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '..', '..');


// --- Middleware de Transpilación en el Servidor ---
const transpileMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.endsWith('.ts') && !req.path.endsWith('.tsx')) {
        return next();
    }
    const filePath = path.join(frontendPath, req.path);
    try {
        await fs.access(filePath);
        const transformed = await babel.transformFileAsync(filePath, {
            presets: ["@babel/preset-typescript", ["@babel/preset-react", { runtime: "automatic" }]],
            sourceMaps: 'inline',
        });
        if (transformed?.code) {
            res.set('Content-Type', 'application/javascript; charset=utf-8');
            res.send(transformed.code);
        } else {
            next(new Error(`Falló la transpilación de Babel para ${req.path}`));
        }
    } catch (error: any) {
        if (error.code === 'ENOENT') return next();
        console.error(`Error de Babel o del sistema de archivos para ${req.path}:`, error);
        next(error);
    }
};

app.use(transpileMiddleware);
app.use(express.static(frontendPath));


// --- Funciones Auxiliares ---
const calculateAge = (dateOfBirth: string | Date): number => {
    const dob = new Date(dateOfBirth);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
};

// Definimos un tipo más completo para el paciente procesado
type ProcessedPatient = ReturnType<typeof processPatient>;

const isActionRequired = (patient: ProcessedPatient): boolean => {
    if (!patient || !patient.surgeryDateTime || patient.isArchived) return false;
    
    const surgeryDate = new Date(patient.surgeryDateTime);
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    const needsSurgicalSignature = !patient.surgicalSignatureImage;
    const needsAnesthesiaSignature = patient.anesthesiaConsent && !patient.anesthesiaSignatureImage;

    return surgeryDate <= twoDaysFromNow && (needsSurgicalSignature || needsAnesthesiaSignature);
}

const patientInclude = {
    surgeon: true,
    anesthesiologist: true,
    surgicalConsent: { select: { id: true, fileName: true } },
    anesthesiaConsent: { select: { id: true, fileName: true } },
};

// Hacemos el tipo de patient explícito
const processPatient = (patient: Patient & { surgicalConsent: any, anesthesiaConsent: any } | null) => {
    if (!patient) return null;

    const {
        isInfant,
        fastingSolids,
        fastingClearLiquids,
        fastingCowMilk,
        fastingBreastMilk,
        ...restOfPatient
    } = patient;

    const fastingInstructions = {
        isInfant: isInfant || false,
        solids: fastingSolids,
        clearLiquids: fastingClearLiquids,
        cowMilk: fastingCowMilk,
        breastMilk: fastingBreastMilk,
    };

    const age = calculateAge(patient.dateOfBirth);
    const isArchived = patient.surgeryDateTime ? new Date(patient.surgeryDateTime) < new Date() : false;
    
    const processed = { 
        ...restOfPatient, 
        fastingInstructions,
        age, 
        isArchived,
        isActionRequired: false // Se calculará después
    };
    
    processed.isActionRequired = isActionRequired(processed);

    return processed;
};


// --- Rutas de la API ---

// GET /api/consent-forms?type=...
app.get('/api/consent-forms', async (req: Request, res: Response) => {
    const type = (req.query.type as string)?.toUpperCase();
    if (!type || !['SURGICAL', 'ANESTHESIA'].includes(type)) {
        return res.status(400).json({ message: 'Tipo de consentimiento inválido.' });
    }

    try {
        const forms = await prisma.consentForm.findMany({
            where: { type: type as 'SURGICAL' | 'ANESTHESIA' },
            select: { id: true, fileName: true },
            orderBy: { fileName: 'asc' }
        });
        res.json(forms);
    } catch (err: any) {
        console.error(`Error leyendo formularios para el tipo ${type}:`, err);
        res.status(500).json({ message: 'No se pudieron recuperar los formularios de consentimiento.' });
    }
});

// GET /api/consent-forms/:id/pdf
app.get('/api/consent-forms/:id/pdf', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const form = await prisma.consentForm.findUnique({
            where: { id },
            select: { fileContent: true, fileName: true }
        });
        if (!form) {
            return res.status(404).json({ message: 'Formulario no encontrado.' });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${form.fileName}"`);
        res.send(form.fileContent);
    } catch (err) {
        console.error(`Error recuperando PDF con ID ${id}:`, err);
        res.status(500).json({ message: 'No se pudo recuperar el PDF.' });
    }
});


// POST /api/surgeons/login y /api/anesthesiologists/login
const handleProfessionalLogin = async (req: Request, res: Response, model: 'surgeon' | 'anesthesiologist') => {
    const { professionalLicenseNumber, password } = req.body;
    try {
        let professional;
        if (model === 'surgeon') {
            professional = await prisma.surgeon.findUnique({ where: { professionalLicenseNumber } });
        } else {
            professional = await prisma.anesthesiologist.findUnique({ where: { professionalLicenseNumber } });
        }
        
        if (professional && professional.password === password) {
            const { password: _, ...professionalData } = professional;
            res.json(professionalData);
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas' });
        }
    } catch (error) {
        console.error(`Error during ${model} login:`, error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

app.post('/api/surgeons/login', (req: Request, res: Response) => handleProfessionalLogin(req, res, 'surgeon'));
app.post('/api/anesthesiologists/login', (req: Request, res: Response) => handleProfessionalLogin(req, res, 'anesthesiologist'));


// POST /api/login (patient)
app.post('/api/login', async (req: Request, res: Response) => {
    const { email, cedula } = req.body;
    try {
        const patient = await prisma.patient.findFirst({ 
            where: { email },
            include: patientInclude
        });
        if (patient && patient.cedula === cedula) {
            res.json(processPatient(patient as any));
        } else {
            res.status(401).json({ message: 'Credenciales inválidas.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error de conexión.' });
    }
});


// GET /api/patients
app.get('/api/patients', async (req: Request, res: Response) => {
    try {
        const patients = await prisma.patient.findMany({
            include: patientInclude,
            orderBy: { surgeryDateTime: 'desc' },
        });
        res.json(patients.map(p => processPatient(p as any)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los pacientes' });
    }
});

// POST /api/patients
app.post('/api/patients', async (req: Request, res: Response) => {
    const { firstName, lastName, email, cedula, dateOfBirth, sex, consentFormId, surgicalProcedure, surgeryDateTime, surgeonId } = req.body;
    try {
        const newPatient = await prisma.patient.create({
            data: {
                firstName, lastName, email, cedula, dateOfBirth, sex,
                surgicalProcedure, surgeryDateTime,
                surgeon: { connect: { id: surgeonId } },
                surgicalConsent: { connect: { id: consentFormId } },
            },
            include: patientInclude
        });
        res.status(201).json(processPatient(newPatient as any));
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Ya existe un paciente con ese correo o cédula.' });
        }
        res.status(500).json({ message: 'Error al crear el paciente' });
    }
});

// PUT /api/patients/:patientId/anesthesia-consent
app.put('/api/patients/:patientId/anesthesia-consent', async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { consentFormId, instructions, fastingInstructions, medicationToSuspend, anesthesiologistId } = req.body;
    try {
        const { isInfant, solids, clearLiquids, cowMilk, breastMilk } = fastingInstructions || {};

        const updatedPatient = await prisma.patient.update({
            where: { id: patientId },
            data: {
                anesthesiaConsent: { connect: { id: consentFormId } },
                anesthesiaInstructions: instructions,
                medicationToSuspend: medicationToSuspend,
                anesthesiologist: { connect: { id: anesthesiologistId } },
                isInfant: isInfant,
                fastingSolids: solids,
                fastingClearLiquids: clearLiquids,
                fastingCowMilk: cowMilk,
                fastingBreastMilk: breastMilk,
            },
            include: patientInclude
        });
        res.json(processPatient(updatedPatient as any));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al añadir el consentimiento de anestesia' });
    }
});

// PUT /api/patients/:patientId/sign-surgical | sign-anesthesia
const handleSignConsent = async (req: Request, res: Response, type: 'surgical' | 'anesthesia') => {
    const { patientId } = req.params;
    const { signatureImage } = req.body;
    try {
        const dataToUpdate = type === 'surgical' 
            ? { surgicalSignatureImage: signatureImage, surgicalSignedDate: new Date().toISOString() }
            : { anesthesiaSignatureImage: signatureImage, anesthesiaSignedDate: new Date().toISOString() };

        const updatedPatient = await prisma.patient.update({
            where: { id: patientId },
            data: dataToUpdate,
            include: patientInclude,
        });
        res.json(processPatient(updatedPatient as any));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al firmar el consentimiento' });
    }
};

app.put('/api/patients/:patientId/sign-surgical', (req: Request, res: Response) => handleSignConsent(req, res, 'surgical'));
app.put('/api/patients/:patientId/sign-anesthesia', (req: Request, res: Response) => handleSignConsent(req, res, 'anesthesia'));


// POST /api/ai/generate-medication-instructions
app.post('/api/ai/generate-medication-instructions', async (req: Request, res: Response) => {
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

        const text = response.text;
        if (!text) {
            return res.status(500).json({ message: "La IA no generó una respuesta de texto válida." });
        }
        res.json(JSON.parse(text));
        
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "Error al generar instrucciones con IA." });
    }
});


// --- "Catch-all" para la SPA ---
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/') || req.path.endsWith('.ts') || req.path.endsWith('.tsx')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});


// --- Arranque del Servidor ---
const startServer = async () => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor y aplicación corriendo en http://localhost:${PORT}`);
    });
};

startServer();