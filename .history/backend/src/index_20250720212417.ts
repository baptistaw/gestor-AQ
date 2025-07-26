import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { PrismaClient, type Patient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import * as babel from '@babel/core';
import nodemailer from 'nodemailer';

/* ──────────────────────────────────────────────────────────────
   Inicialización y validación de variables
────────────────────────────────────────────────────────────── */
dotenv.config();

for (const v of ['DATABASE_URL', 'API_KEY']) {
  if (!process.env[v]) {
    console.error(`❌ Falta la variable de entorno ${v}`);
    process.exit(1);
  }
}

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/* ──────────────────────────────────────────────────────────────
   Configuración SMTP (Nodemailer)
────────────────────────────────────────────────────────────── */
let transporter: nodemailer.Transporter | null = null;
const SMTP_VARS = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];

if (SMTP_VARS.every(v => !!process.env[v])) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465, // SSL para Gmail
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify()
    .then(() => console.log('📧  SMTP listo'))
    .catch(err => console.error('❌  Error SMTP:', err));
} else {
  console.warn('⚠️  SMTP no configurado: se deshabilita el envío de correos.');
}

/* ──────────────────────────────────────────────────────────────
   Middleware
────────────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '..', '..');

// Transpile .ts/.tsx on the fly (dev only)
const transpileMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.endsWith('.ts') && !req.path.endsWith('.tsx')) return next();

  const filePath = path.join(frontendPath, req.path);
  try {
    await fs.access(filePath);
    const out = await babel.transformFileAsync(filePath, {
      presets: [
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      sourceMaps: 'inline',
    });
    if (out?.code) {
      res.type('application/javascript').send(out.code);
    } else {
      next(new Error(`Babel no transformó ${req.path}`));
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') return next();
    console.error('Babel error:', err);
    next(err);
  }
};
app.use(transpileMiddleware);
app.use(express.static(frontendPath));

/* ──────────────────────────────────────────────────────────────
   Funciones auxiliares
────────────────────────────────────────────────────────────── */
const calculateAge = (dob: string | Date) =>
  Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970);

type ProcessedPatient = ReturnType<typeof processPatient>;

const isActionRequired = (p: ProcessedPatient) => {
  if (!p || !p.surgeryDateTime || p.isArchived) return false;
  const surgeryDate = new Date(p.surgeryDateTime);
  const limit = new Date(); limit.setDate(limit.getDate() + 2);
  const needsSign =
    !p.surgicalSignatureImage ||
    (p.anesthesiaConsent && !p.anesthesiaSignatureImage);
  return surgeryDate <= limit && needsSign;
};

const patientInclude = {
  surgeon: true,
  anesthesiologist: true,
  surgicalConsent: { select: { id: true, fileName: true } },
  anesthesiaConsent: { select: { id: true, fileName: true } },
};

const processPatient = (
  patient: Patient & { surgicalConsent: any; anesthesiaConsent: any } | null,
) => {
  if (!patient) return null;
  const {
    isInfant,
    fastingSolids,
    fastingClearLiquids,
    fastingCowMilk,
    fastingBreastMilk,
    ...rest
  } = patient;

  const fastingInstructions = {
    isInfant: isInfant ?? false,
    solids: fastingSolids,
    clearLiquids: fastingClearLiquids,
    cowMilk: fastingCowMilk,
    breastMilk: fastingBreastMilk,
  };

  const processed = {
    ...rest,
    fastingInstructions,
    age: calculateAge(patient.dateOfBirth),
    isArchived: patient.surgeryDateTime
      ? new Date(patient.surgeryDateTime) < new Date()
      : false,
  } as any;
  processed.isActionRequired = isActionRequired(processed);
  return processed;
};

/* ──────────────────────────────────────────────────────────────
   Rutas de la API (se conserva TODO el código original)
────────────────────────────────────────────────────────────── */

/* === Formularios de consentimiento === */
app.get('/api/consent-forms', async (req, res) => {
  const type = (req.query.type as string)?.toUpperCase();
  if (!type || !['SURGICAL', 'ANESTHESIA'].includes(type))
    return res.status(400).json({ message: 'Tipo inválido.' });

  try {
    const forms = await prisma.consentForm.findMany({
      where: { type: type as 'SURGICAL' | 'ANESTHESIA' },
      select: { id: true, fileName: true },
      orderBy: { fileName: 'asc' },
    });
    res.json(forms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'No se pudieron recuperar los formularios.' });
  }
});

app.get('/api/consent-forms/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const form = await prisma.consentForm.findUnique({
      where: { id },
      select: { fileContent: true, fileName: true },
    });
    if (!form) return res.status(404).json({ message: 'No encontrado.' });

    res
      .type('application/pdf')
      .setHeader('Content-Disposition', `inline; filename="${form.fileName}"`)
      .send(form.fileContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error obteniendo PDF.' });
  }
});

/* === Login de profesionales === */
const handleProfessionalLogin = async (
  req: Request,
  res: Response,
  model: 'surgeon' | 'anesthesiologist',
) => {
  const { professionalLicenseNumber, password } = req.body;
  try {
    const professional =
      model === 'surgeon'
        ? await prisma.surgeon.findUnique({ where: { professionalLicenseNumber } })
        : await prisma.anesthesiologist.findUnique({
            where: { professionalLicenseNumber },
          });

    if (professional && professional.password === password) {
      const { password: _, ...data } = professional;
      res.json(data);
    } else {
      res.status(401).json({ message: 'Credenciales incorrectas' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

app.post('/api/surgeons/login', (req, res) =>
  handleProfessionalLogin(req, res, 'surgeon'),
);
app.post('/api/anesthesiologists/login', (req, res) =>
  handleProfessionalLogin(req, res, 'anesthesiologist'),
);

/* === Login de paciente === */
app.post('/api/login', async (req, res) => {
  const { email, cedula } = req.body;
  try {
    const patient = await prisma.patient.findFirst({
      where: { email },
      include: patientInclude,
    });
    if (patient && patient.cedula === cedula) {
      res.json(processPatient(patient as any));
    } else {
      res.status(401).json({ message: 'Credenciales inválidas.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error de conexión.' });
  }
});

/* === CRUD Pacientes === */
app.get('/api/patients', async (_, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: patientInclude,
      orderBy: { surgeryDateTime: 'desc' },
    });
    res.json(patients.map(p => processPatient(p as any)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener pacientes.' });
  }
});

app.post('/api/patients', async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    cedula,
    dateOfBirth,
    sex,
    consentFormId,
    surgicalProcedure,
    surgeryDateTime,
    surgeonId,
  } = req.body;
  try {
    const newPatient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email,
        cedula,
        dateOfBirth: new Date(dateOfBirth),
        sex,
        surgicalProcedure,
        surgeryDateTime,
        surgeon: { connect: { id: surgeonId } },
        surgicalConsent: { connect: { id: consentFormId } },
      },
      include: patientInclude,
    });
    res.status(201).json(processPatient(newPatient as any));
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2002')
      return res
        .status(409)
        .json({ message: 'Ya existe un paciente con ese correo o cédula.' });
    res.status(500).json({ message: 'Error al crear paciente.' });
  }
});

/* === Actualizar consentimiento de anestesia === */
app.put('/api/patients/:patientId/anesthesia-consent', async (req, res) => {
  const { patientId } = req.params;
  const {
    consentFormId,
    instructions,
    fastingInstructions,
    medicationToSuspend,
    anesthesiologistId,
  } = req.body;
  const { isInfant, solids, clearLiquids, cowMilk, breastMilk } =
    fastingInstructions || {};

  try {
    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        anesthesiaConsent: { connect: { id: consentFormId } },
        anesthesiaInstructions: instructions,
        medicationToSuspend,
        anesthesiologist: { connect: { id: anesthesiologistId } },
        isInfant,
        fastingSolids: solids,
        fastingClearLiquids: clearLiquids,
        fastingCowMilk: cowMilk,
        fastingBreastMilk: breastMilk,
      },
      include: patientInclude,
    });
    res.json(processPatient(updated as any));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al añadir consentimiento.' });
  }
});

/* === Firmar consentimientos === */
const handleSignConsent = async (
  req: Request,
  res: Response,
  type: 'surgical' | 'anesthesia',
) => {
  const { patientId } = req.params;
  const { signatureImage } = req.body;
  try {
    const data =
      type === 'surgical'
        ? {
            surgicalSignatureImage: signatureImage,
            surgicalSignedDate: new Date().toISOString(),
          }
        : {
            anesthesiaSignatureImage: signatureImage,
            anesthesiaSignedDate: new Date().toISOString(),
          };

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data,
      include: patientInclude,
    });
    res.json(processPatient(updated as any));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al firmar consentimiento.' });
  }
};

app.put('/api/patients/:patientId/sign-surgical', (req, res) =>
  handleSignConsent(req, res, 'surgical'),
);
app.put('/api/patients/:patientId/sign-anesthesia', (req, res) =>
  handleSignConsent(req, res, 'anesthesia'),
);

/* === Enviar consentimientos por e‑mail === */
app.post('/api/patients/:patientId/send-consent-email', async (req, res) => {
  if (!transporter)
    return res.status(503).json({ message: 'SMTP no disponible en el servidor' });

  const { patientId } = req.params;

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { surgicalConsent: true, anesthesiaConsent: true },
    });

    if (!patient?.email)
      return res.status(404).json({ message: 'Paciente o e‑mail no encontrado' });

 const attachments: nodemailer.SendMailOptions['attachments'] = [];
    if (patient.surgicalConsent) {
      attachments.push({
        filename: patient.surgicalConsent.fileName,
        content: patient.surgicalConsent.fileContent,
        contentType: 'application/pdf',
      });
    }
    if (patient.anesthesiaConsent) {
      attachments.push({
        filename: patient.anesthesiaConsent.fileName,
        content: patient.anesthesiaConsent.fileContent,
        contentType: 'application/pdf',
      });
    }
    if (!attachments.length)
      return res.status(400).json({ message: 'Sin consentimientos para enviar' });

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME ?? 'Gestor de Consentimientos'}" <${process.env.EMAIL_FROM}>`,
      to: patient.email,
      subject: 'Sus consentimientos preoperatorios',
      text: 'Adjuntamos sus formularios de consentimiento.',
      attachments,
    });

/* --- 1.  URL directa al portal paciente con e‑mail precargado --- */
        const portalUrl =
          `${process.env.PUBLIC_BASE_URL || req.protocol + '://' + req.get('host')}` +
          `/#patient?email=${encodeURIComponent(patient.email)}`;

        /* --- 2.  E‑mail en HTML con pasos claros ------------------------ */
        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'Gestor de Consentimientos'}" <${process.env.EMAIL_FROM}>`,
          to: patient.email,
          subject: 'Acceso a sus Consentimientos y Próximos Pasos',
          html: `
            <div style="font-family: sans-serif; line-height:1.6; color:#0f172a">
              <h2 style="margin-top:0">Hola ${patient.firstName},</h2>

              <p>
                Adjuntamos los documentos de consentimiento informados que debes
                leer antes de tu cirugía.
              </p>

              <h3 style="margin:1.5em 0 0.5em">Cómo ingresar a la plataforma</h3>
              <ol style="padding-left:1.2em">
                <li>
                  Pulsa en este enlace seguro:
                  <br>
                  <a href="${portalUrl}" style="color:#2563eb">${portalUrl}</a>
                </li>
                <li>
                  Tu <strong>usuario</strong> es tu correo: <em>${patient.email}</em><br>
                  Tu <strong>contraseña</strong> es tu número de cédula.
                </li>
                <li>
                  Al ingresar, elige “<em>Instalar aplicación</em>” para tener el
                  acceso directo en la pantalla de inicio de tu móvil.
                </li>
              </ol>

              <h3 style="margin:1.5em 0 0.5em">Para qué sirve la plataforma</h3>
              <ul style="padding-left:1.2em; list-style:disc">
                <li>
                  Ingresa la <strong>fecha y hora exacta de tu cirugía</strong>
                  en cuanto te la confirme tu cirujano.
                </li>
                <li>
                  Activa las <strong>notificaciones</strong>:<br>
                  te avisaremos cuándo iniciar el ayuno y, si corresponde,
                  cuándo suspender ciertos medicamentos.
                </li>
                <li>
                  Podrás firmar electrónicamente los consentimientos que aún
                  estén pendientes.
                </li>
              </ul>

              <p style="margin-top:1.5em">
                Ante cualquier duda, responde a este correo o comunícate con tu
                equipo médico.
              </p>

              <p style="margin-top:2em">
                ¡Gracias por tu colaboración!<br>
                <strong>Tu Equipo Médico</strong>
              </p>
            </div>
          `,
          attachments,
+        });

    res.json({ message: 'Correo enviado' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Fallo al enviar correo' });
  }
});

/* === Endpoint IA Gemini === */
app.post('/api/ai/generate-medication-instructions', async (req, res) => {
  const { medications, surgicalProcedure } = req.body;
  if (!medications || !surgicalProcedure)
    return res
      .status(400)
      .json({ message: 'Se requiere medicación y cirugía.' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Un paciente que toma "${medications}" será operado de "${surgicalProcedure}". Genera instrucciones sobre qué medicamentos suspender, en español.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            instructionsText: { type: Type.STRING },
            medicationsToSuspend: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['instructionsText', 'medicationsToSuspend'],
        },
      },
    });

    if (!response.text)
      return res.status(500).json({ message: 'IA sin respuesta válida.' });

    res.json(JSON.parse(response.text));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error IA.' });
  }
});

/* ──────────────────────────────────────────────────────────────
   Catch‑all para la SPA
────────────────────────────────────────────────────────────── */
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api/') ||
    req.path.endsWith('.ts') ||
    req.path.endsWith('.tsx')
  )
    return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ──────────────────────────────────────────────────────────────
   Arranque
────────────────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`🚀  Backend listo en http://localhost:${PORT}`),
);
