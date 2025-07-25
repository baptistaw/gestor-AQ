
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';


// NOTE TO USER: This updated backend assumes you have modified your `prisma/schema.prisma`
// to reflect the new data model for Patient, and added new models for Surgeon and Anesthesiologist.
// You will need to run `npx prisma migrate dev` to apply these changes to your database.

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });


// --- MOCK DATA ---
// In a real application, this user data would be stored in the database and hashed.
const mockSurgeons = [
  { id: 'surg1', firstName: 'Elena', lastName: 'Vargas', professionalLicenseNumber: 'SURG123', password: 'password123', specialty: 'Cirugía General' },
  { id: 'surg2', firstName: 'Roberto', lastName: 'Morales', professionalLicenseNumber: 'SURG456', password: 'password123', specialty: 'Ortopedia y Traumatología' },
];
const mockAnesthesiologists = [
  { id: 'anes1', firstName: 'Carlos', lastName: 'Ruiz', professionalLicenseNumber: 'ANES789', password: 'password123' },
  { id: 'anes2', firstName: 'Lucía', lastName: 'Jiménez', professionalLicenseNumber: 'ANES012', password: 'password123' },
];

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.resolve(__dirname, '..', 'uploads');
app.use('/uploads/surgical', express.static(path.join(uploadDir, 'surgical')));
app.use('/uploads/anesthesia', express.static(path.join(uploadDir, 'anesthesia')));

// --- Helper Functions ---
const calculateAge = (dateOfBirth: Date): number => {
    const ageDifMs = Date.now() - dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const transformPatientData = (patient: any) => {
    const {
        fastingSolids, fastingClearLiquids, fastingCowMilk, fastingBreastMilk, isInfant,
        cedula: patientCedula,
        ...rest
    } = patient;

    const age = patient.dateOfBirth ? calculateAge(new Date(patient.dateOfBirth)) : 0;
    const surgeon = patient.surgeonId ? mockSurgeons.find(s => s.id === patient.surgeonId) || null : null;
    const anesthesiologist = patient.anesthesiologistId ? mockAnesthesiologists.find(a => a.id === patient.anesthesiologistId) || null : null;

    if (surgeon) delete (surgeon as any).password;
    if (anesthesiologist) delete (anesthesiologist as any).password;

    // --- NEW LOGIC for status flags ---
    const now = new Date();
    const surgeryDate = patient.surgeryDateTime ? new Date(patient.surgeryDateTime) : null;
    
    const isArchived = surgeryDate ? surgeryDate < now : false;

    let isActionRequired = false;
    // An action is required if the surgery is within the next 7 days and not all consents are signed.
    if (surgeryDate && !isArchived) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);
        if (surgeryDate <= sevenDaysFromNow) {
            // Both surgical and anesthesia consents must exist and be signed.
            // Action is required if anesthesia part is not even added yet, OR if it is added but not signed.
            const needsAnesthesiaConsent = !patient.anesthesiaConsentPDFName;
            const needsAnesthesiaSignature = patient.anesthesiaConsentPDFName && !patient.anesthesiaSignatureImage;
            const needsSurgicalSignature = !patient.surgicalSignatureImage;

            if (needsSurgicalSignature || needsAnesthesiaConsent || needsAnesthesiaSignature) {
                isActionRequired = true;
            }
        }
    }

    return {
        ...rest,
        cedula: patientCedula,
        age,
        surgeon,
        anesthesiologist,
        isArchived,
        isActionRequired,
        fastingInstructions: {
            isInfant: isInfant,
            solids: fastingSolids,
            clearLiquids: fastingClearLiquids,
            cowMilk: fastingCowMilk,
            breastMilk: fastingBreastMilk,
        },
    };
};

// --- API Routes ---

app.post('/api/ai/generate-medication-instructions', async (req: Request, res: Response) => {
    const { medications, surgicalProcedure } = req.body;
    
    if (!medications) {
        return res.status(400).json({ message: 'Medications are required.' });
    }
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            instructionsText: {
                type: Type.STRING,
                description: 'Un texto claro y conciso dirigido al paciente, formateado como una lista de puntos, explicando qué medicación suspender y cuándo, basado en la cirugía. Empieza con "Para su seguridad antes de la cirugía, por favor siga estas indicaciones:"'
            },
            medicationsToSuspend: {
                type: Type.ARRAY,
                description: 'Un array de strings con los nombres de los medicamentos que el paciente debe suspender. Cada string debe seguir el formato "Nombre del fármaco - instrucción breve", por ejemplo, "AAS (Aspirina) - suspender 7 días antes".',
                items: {
                    type: Type.STRING
                }
            }
        },
        required: ['instructionsText', 'medicationsToSuspend']
    };

    const prompt = `Eres un asistente de anestesiólogo experto. La medicación actual de un paciente es: "${medications}". El procedimiento quirúrgico es: "${surgicalProcedure || 'No especificado'}". Genera instrucciones preoperatorias de suspensión de medicamentos. Sé específico sobre los tiempos (p. ej., 7 días, 3 días, la mañana de la cirugía). Prioriza la seguridad del paciente. Si un medicamento no requiere suspensión, no lo menciones en las instrucciones.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        res.json(jsonResponse);
    } catch (error) {
        console.error("AI generation error:", error);
        res.status(500).json({ message: 'Error al generar instrucciones con IA.' });
    }
});


app.get('/api/consent-forms', async (req: Request, res: Response) => {
    const type = req.query.type as ('surgical' | 'anesthesia' | undefined);
    if (!type) return res.status(400).json({ message: 'Form type is required' });

    try {
        const specificUploadDir = path.join(uploadDir, type);
        await fs.mkdir(specificUploadDir, { recursive: true }); // Ensure directory exists
        const files = await fs.readdir(specificUploadDir);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
        res.json(pdfFiles);
    } catch (error) {
        console.error(`Error reading ${type} consent forms:`, error);
        res.status(500).json({ message: 'Error al obtener los formularios.' });
    }
});

app.get('/api/patients', async (req: Request, res: Response) => {
    try {
        const patients = await prisma.patient.findMany({ orderBy: { surgeryDateTime: 'desc' } });
        res.json(patients.map(transformPatientData));
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los pacientes.' });
    }
});

app.post('/api/patients', async (req: Request, res: Response) => {
    try {
        const { 
            firstName, lastName, email, cedula, dateOfBirth, sex,
            consentPDFName, surgicalProcedure, surgeryDateTime, surgeonId
        } = req.body;
        
        const newPatient = await prisma.patient.create({
            data: {
                firstName, lastName, email, cedula, dateOfBirth: new Date(dateOfBirth), sex,
                surgeonId,
                surgicalConsentPDFName: consentPDFName,
                surgicalProcedure,
                surgeryDateTime: surgeryDateTime ? new Date(surgeryDateTime) : null,
            }
        });
        res.status(201).json(transformPatientData(newPatient));
    } catch (error) {
        console.error("Error creating patient:", error);
        res.status(500).json({ message: 'Error al crear el paciente.' });
    }
});

app.put('/api/patients/:id/anesthesia-consent', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            anesthesiologistId, consentPDFName, instructions,
            fastingInstructions, medicationToSuspend
        } = req.body;

        const updatedPatient = await prisma.patient.update({
            where: { id },
            data: {
                anesthesiologistId,
                anesthesiaConsentPDFName: consentPDFName,
                anesthesiaInstructions: instructions,
                isInfant: fastingInstructions.isInfant,
                fastingSolids: fastingInstructions.solids,
                fastingClearLiquids: fastingInstructions.clearLiquids,
                fastingCowMilk: fastingInstructions.cowMilk,
                fastingBreastMilk: fastingInstructions.breastMilk,
                medicationToSuspend,
            }
        });
        res.json(transformPatientData(updatedPatient));
    } catch(error) {
        console.error("Error adding anesthesia consent:", error);
        res.status(500).json({ message: 'Error al añadir consentimiento de anestesia.' });
    }
});


// --- LOGIN ENDPOINTS ---

app.post('/api/surgeons/login', (req: Request, res: Response) => {
    const { professionalLicenseNumber, password } = req.body;
    const surgeon = mockSurgeons.find(s => s.professionalLicenseNumber === professionalLicenseNumber && s.password === password);
    if (surgeon) {
        const { password, ...surgeonData } = surgeon;
        res.json(surgeonData);
    } else {
        res.status(401).json({ message: 'Matrícula o contraseña incorrecta.' });
    }
});

app.post('/api/anesthesiologists/login', (req: Request, res: Response) => {
    const { professionalLicenseNumber, password } = req.body;
    const anesthesiologist = mockAnesthesiologists.find(a => a.professionalLicenseNumber === professionalLicenseNumber && a.password === password);
    if (anesthesiologist) {
        const { password, ...anesthesiologistData } = anesthesiologist;
        res.json(anesthesiologistData);
    } else {
        res.status(401).json({ message: 'Matrícula o contraseña incorrecta.' });
    }
});

app.post('/api/login', async (req: Request, res: Response) => {
    try {
        const { email, cedula } = req.body;
        const allUserSurgeries = await prisma.patient.findMany({ 
            where: { email, cedula },
            orderBy: { surgeryDateTime: 'asc' }
        });

        if (allUserSurgeries.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas o paciente no encontrado.' });
        }
        
        const transformedSurgeries = allUserSurgeries.map(transformPatientData);

        // Find the next upcoming, non-archived surgery.
        const nextActiveSurgery = transformedSurgeries.find(p => !p.isArchived);
        
        if (nextActiveSurgery) {
            // Send the most relevant surgery for the patient to interact with.
            return res.json(nextActiveSurgery);
        }

        // If all surgeries are in the past, deny login to the signing portal.
        return res.status(401).json({ message: 'No tiene consentimientos pendientes. Todos sus procedimientos han sido archivados.' });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- SIGNING ENDPOINTS ---

app.put('/api/patients/:id/sign-surgical', async (req: Request, res: Response) => {
    try {
        const updatedPatient = await prisma.patient.update({
            where: { id: req.params.id },
            data: {
                surgicalSignatureImage: req.body.signatureImage,
                surgicalSignedDate: new Date(),
            }
        });
        res.json(transformPatientData(updatedPatient));
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar la firma quirúrgica.' });
    }
});

app.put('/api/patients/:id/sign-anesthesia', async (req: Request, res: Response) => {
    try {
        const updatedPatient = await prisma.patient.update({
            where: { id: req.params.id },
            data: {
                anesthesiaSignatureImage: req.body.signatureImage,
                anesthesiaSignedDate: new Date(),
            }
        });
        res.json(transformPatientData(updatedPatient));
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar la firma de anestesia.' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});