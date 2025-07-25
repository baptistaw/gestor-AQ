import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { PrismaClient, ConsentType, type Patient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import * as babel from '@babel/core';
import nodemailer from 'nodemailer';
import {
  UpsertFastingPlanDTO,
  CreateSuspensionDTO,
  AdminLoginDTO,           // 👈 NUEVO
  CreateProviderDTO,       // 👈 NUEVO
  CreateProfessionalDTO    // 👈 NUEVO
} from './types.tsx';
/* …el resto de tus imports sin tocar… */


/* ⬇️ IMPORTS LOCALES – ahora con .js */
import { schedulePatientNotification } from './notify.js';

interface AdminLoginDTO       { email:string; password:string }
interface CreateProviderDTO   { name:string; address:string; phone?:string; contactEmail?:string }
interface CreateProfessionalDTO {
  providerId: string;
  role: 'SURGEON'|'ANESTHESIOLOGIST';
  firstName:string; lastName:string;
  license:string;  password:string;
}
interface UpsertFastingPlanDTO { solids:string; clearLiquids:string;
  cowMilk?:string|null; breastMilk?:string|null; startAt:string }
interface CreateSuspensionDTO  { medicationName:string; suspendAt:string; resumeAt?:string }

/* ──────────────────────────────────────────────────────────────
   Inicialización
────────────────────────────────────────────────────────────── */
dotenv.config();

for (const v of ['DATABASE_URL', 'API_KEY']) {
  if (!process.env[v]) {
    console.error(`❌ Falta la variable de entorno ${v}`);
    process.exit(1);
  }
}

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const app = express();
const PORT = process.env.PORT || 4000;

/* ──────────────────────────────────────────────────────────────
   Configuración SMTP (Nodemailer)
────────────────────────────────────────────────────────────── */
let transporter: nodemailer.Transporter | null = null;
if (
  ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'].every(
    (v) => !!process.env[v],
  )
) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  transporter
    .verify()
    .then(() => console.log('📧 SMTP listo'))
    .catch((e) => console.error('❌ Error SMTP:', e));
} else {
  console.warn('⚠️ SMTP no configurado; se deshabilita el envío de correos.');
}

/* ──────────────────────────────────────────────────────────────
   Middleware
────────────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '..', '..');

/* ─── Transpila .ts/.tsx en caliente (solo desarrollo) ─────── */
app.use(async (req: Request, res: Response, next: NextFunction) => {
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
    if (out?.code) res.type('application/javascript').send(out.code);
    else next(new Error(`Babel no transformó ${req.path}`));
  } catch (err: any) {
    if (err.code === 'ENOENT') return next();
    console.error('Babel error:', err);
    next(err);
  }
});
app.use(express.static(frontendPath));

/* ──────────────────────────────────────────────────────────────
   Ayudas
────────────────────────────────────────────────────────────── */
const calculateAge = (dob: string | Date) =>
  Math.abs(
    new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970,
  );

const patientInclude = {
  surgeon: true,
  anesthesiologist: true,
  surgicalConsent: { select: { id: true, fileName: true, filePath: true } },
  anesthesiaConsent: { select: { id: true, fileName: true, filePath: true } },
  provider: true,
};

const isActionRequired = (p: any) => {
  if (!p || !p.surgeryDateTime || p.isArchived) return false;
  const surgeryDate = new Date(p.surgeryDateTime);
  const limit = new Date();
  limit.setDate(limit.getDate() + 2);
  const needsSign =
    !p.surgicalSignatureImage ||
    (p.anesthesiaConsent && !p.anesthesiaSignatureImage);
  return surgeryDate <= limit && needsSign;
};

const processPatient = (
  patient: Patient & {
    surgicalConsent: any;
    anesthesiaConsent: any;
  } | null,
) => {
  if (!patient) return null;
  const processed = {
    ...patient,
    age: calculateAge(patient.dateOfBirth),
    isArchived: patient.surgeryDateTime
      ? new Date(patient.surgeryDateTime) < new Date()
      : false,
  } as any;
  processed.isActionRequired = isActionRequired(processed);
  return processed;
};

/* util para ocultar password al serializar */
const stripPassword = <T extends { password?: string }>(obj: T) => {
  const { password, ...rest } = obj;
  return rest;
};

/* ──────────────────────────────────────────────────────────────
   Rutas API
────────────────────────────────────────────────────────────── */

/* === Formularios de consentimiento === */
app.get('/api/consent-forms', async (req, res) => {
  const type = (req.query.type as string)?.toUpperCase();
  if (!['SURGICAL', 'ANESTHESIA'].includes(type || ''))
    return res.status(400).json({ message: 'Tipo inválido.' });

  const forms = await prisma.consentForm.findMany({
    where: { type: type as ConsentType },
    select: { id: true, fileName: true },
    orderBy: { fileName: 'asc' },
  });
  res.json(forms);
});

app.get('/api/consent-forms/:id/pdf', async (req, res) => {
  const form = await prisma.consentForm.findUnique({
    where: { id: req.params.id },
    select: { filePath: true, fileName: true },
  });
  if (!form) return res.status(404).json({ message: 'No encontrado.' });
  res
    .type('application/pdf')
    .setHeader(
      'Content-Disposition',
      `inline; filename="${form.fileName}"`,
    )
    .sendFile(form.filePath);
});

/* ───────────────────────────────────────────────
   LOGIN DE PROFESIONALES  (reemplaza toda la
   función handleProfessionalLogin)
────────────────────────────────────────────── */
const handleProfessionalLogin = async (
  req: Request,
  res: Response,
  model: 'surgeon' | 'anesthesiologist',
) => {
  const { professionalLicenseNumber, password } = req.body;
  const professional =
    model === 'surgeon'
      ? await prisma.surgeon.findUnique({ where: { professionalLicenseNumber } })
      : await prisma.anesthesiologist.findUnique({
          where: { professionalLicenseNumber },
        });

  if (professional && professional.password === password) {
    // ⚠️ Excluir la contraseña antes de enviar la respuesta
    // eslint‑disable‑next‑line @typescript-eslint/no-unused-vars
    const { password: _pw, ...data } = professional;
    res.json(data);
  } else {
    res.status(401).json({ message: 'Credenciales incorrectas' });
  }
};


app.post('/api/surgeons/login', (r, s) => handleProfessionalLogin(r, s, 'surgeon'));
app.post('/api/anesthesiologists/login', (r, s) =>
  handleProfessionalLogin(r, s, 'anesthesiologist'),
);

/* === Login paciente === */
app.post('/api/login', async (req, res) => {
  const { email, cedula } = req.body;
  const patient = await prisma.patient.findFirst({
    where: { email },
    include: patientInclude,
  });
  if (patient?.cedula === cedula) res.json(processPatient(patient as any));
  else res.status(401).json({ message: 'Credenciales inválidas.' });
});

// POST /api/admin/login

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body as AdminLoginDTO;
  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin && admin.password === password) {
      // eslint‑disable‑next‑line @typescript-eslint/no-unused-vars
      const { password: _pw, ...data } = admin;
      res.json(data);
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


// GET  /api/providers

app.get('/api/providers', async (_, res) => {
  const list = await prisma.healthProvider.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(list);
});

// POST /api/providers
app.post('/api/providers', async (req, res) => {
  const dto = req.body as CreateProviderDTO;
  try {
    const p = await prisma.healthProvider.create({ data: dto });
    res.status(201).json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
});

/* ───────────────────────────────────────────────
   VINCULAR PROFESIONAL ↔ PROVEEDOR
────────────────────────────────────────────── */
// PATCH /api/providers/:id/add-surgeon/:surgeonId
app.patch('/api/providers/:id/add-surgeon/:surgeonId', async (req, res) => {
  try {
    await prisma.surgeon.update({
      where: { id: req.params.surgeonId },
      data: { providers: { connect: { id: req.params.id } } }, // 👈 propiedad correcta
    });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al vincular' });
  }
});

// PATCH /api/providers/:id/add-anesth/:anesthId
app.patch('/api/providers/:id/add-anesth/:anesthId', async (req, res) => {
  try {
    await prisma.anesthesiologist.update({
      where: { id: req.params.anesthId },
      data: { providers: { connect: { id: req.params.id } } }, // 👈 propiedad correcta
    });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al vincular' });
  }
});


/* ===========================================================
   1.  Login Admin
   =========================================================== */
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    // 🔐  En producción deberías devolver un JWT; de momento devolvemos el objeto
    //     sin el password para simplificar el flujo.
    const { password: _, ...safe } = admin;
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error de servidor' });
  }
});

/* ===========================================================
   2.  CRUD Prestadores de Salud
   =========================================================== */
app.get('/api/providers', async (_, res) => {
  const list = await prisma.healthProvider.findMany({ orderBy: { name: 'asc' }});
  res.json(list);
});

app.post('/api/providers', async (req, res) => {
  try {
    const created = await prisma.healthProvider.create({ data: req.body });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Datos inválidos o duplicados' });
  }
});

/* ───────────────────────────────────────────────
   CREAR PROFESIONAL  (corrige provider → providers)
   Ruta POST /api/professionals
────────────────────────────────────────────── */
app.post('/api/professionals', async (req, res) => {
  const dto = req.body as CreateProfessionalDTO;

  try {
    if (dto.role === 'SURGEON') {
      const surg = await prisma.surgeon.create({
        data: {
          firstName: dto.firstName,
          lastName:  dto.lastName,
          professionalLicenseNumber: dto.license,
          password: dto.password,
          providers: { connect: { id: dto.providerId } },     // 👈 CAMBIO
        },
      });
      res.status(201).json(surg);
    } else {
      const an = await prisma.anesthesiologist.create({
        data: {
          firstName: dto.firstName,
          lastName:  dto.lastName,
          professionalLicenseNumber: dto.license,
          password: dto.password,
          providers: { connect: { id: dto.providerId } },     // 👈 CAMBIO
        },
      });
      res.status(201).json(an);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear profesional' });
  }
});


/* ===========================================================
   3.  Vincular Profesional ⇄ Prestador
   =========================================================== */
// POST /api/providers/:id/add-professional
app.post('/api/providers/:id/add-professional', async (req, res) => {
  const { professionalId, role } = req.body as {
    professionalId: string; // id del cirujano o anestesiólogo
    role: 'SURGEON' | 'ANESTHESIOLOGIST';
  };
  try {
    if (role === 'SURGEON') {
      await prisma.surgeon.update({
        where: { id: professionalId },
        data: { providers: { connect: { id: req.params.id } } },
      });
    } else {
      await prisma.anesthesiologist.update({
        where: { id: professionalId },
        data: { providers: { connect: { id: req.params.id } } },
      });
    }
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'No se pudo vincular' });
  }
});

/* === CRUD Pacientes === */
app.get('/api/patients', async (_, res) => {
  const list = await prisma.patient.findMany({
    include: patientInclude,
    orderBy: { surgeryDateTime: 'desc' },
  });
  res.json(list.map((p) => processPatient(p as any)));
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
    providerId,
  } = req.body;

  try {
    const created = await prisma.patient.create({
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
        provider: { connect: { id: providerId } },
      },
      include: patientInclude,
    });
    res.status(201).json(processPatient(created as any));
  } catch (e: any) {
    if (e.code === 'P2002')
      return res
        .status(409)
        .json({ message: 'Ya existe un paciente con ese correo o cédula.' });
    console.error(e);
    res.status(500).json({ message: 'Error al crear paciente.' });
  }
});

// POST /api/professionals
app.post('/api/professionals', async (req, res) => {
  const dto = req.body as CreateProfessionalDTO;
  try {
    if (dto.role === 'SURGEON') {
      const surg = await prisma.surgeon.create({
        data: {
          firstName: dto.firstName,
          lastName:  dto.lastName,
          professionalLicenseNumber: dto.license,
          password: dto.password,
          provider: { connect: { id: dto.providerId } },
        },
      });
      return res.status(201).json(stripPassword(surg));
    }

    const anes = await prisma.anesthesiologist.create({
      data: {
        firstName: dto.firstName,
        lastName:  dto.lastName,
        professionalLicenseNumber: dto.license,
        password: dto.password,
        provider: { connect: { id: dto.providerId } },
      },
    });
    res.status(201).json(stripPassword(anes));
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002')
      return res.status(409).json({ message: 'Matrícula duplicada' });
    res.status(500).json({ message: 'Error al crear profesional' });
  }
});


/* === Consentimiento de anestesia === */
app.put('/api/patients/:id/anesthesia-consent', async (req, res) => {
  const { id } = req.params;
  const {
    consentFormId,
    instructions,
    medicationToSuspend,
    anesthesiologistId,
  } = req.body;

  try {
    const updated = await prisma.patient.update({
      where: { id },
      data: {
        anesthesiaConsent: { connect: { id: consentFormId } },
        anesthesiaInstructions: instructions,
        medicationToSuspend,
        anesthesiologist: { connect: { id: anesthesiologistId } },
      },
      include: patientInclude,
    });
    res.json(processPatient(updated as any));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al añadir consentimiento.' });
  }
});

/* === Firma de consentimientos === */
const handleSign = async (
  req: Request,
  res: Response,
  type: 'surgical' | 'anesthesia',
) => {
  const { id } = req.params;
  const { signatureImage } = req.body;
  const data =
    type === 'surgical'
      ? {
          surgicalSignatureImage: signatureImage,
          surgicalSignedDate: new Date(),
        }
      : {
          anesthesiaSignatureImage: signatureImage,
          anesthesiaSignedDate: new Date(),
        };

  const updated = await prisma.patient.update({
    where: { id },
    data,
    include: patientInclude,
  });
  res.json(processPatient(updated as any));
};

app.put('/api/patients/:id/sign-surgical', (r, s) => handleSign(r, s, 'surgical'));
app.put('/api/patients/:id/sign-anesthesia', (r, s) =>
  handleSign(r, s, 'anesthesia'),
);

/* ───────────────────────────────────────────────
   UPSERT FASTING PLAN  (patch rápido de typing)
────────────────────────────────────────────── */
app.put('/api/patients/:id/fasting-plan', async (req, res) => {
  const data = req.body as UpsertFastingPlanDTO;
  try {
    const plan = await prisma.fastingPlan.upsert({
      where:  { patientId: req.params.id },
      create: { ...data, patientId: req.params.id },
      update: { ...data } as any,          // 👈 parche de tipado
    });
    /* …resto intacto… */


/* === E‑mail con adjuntos + link al portal === */
app.post('/api/patients/:id/send-consent-email', async (req, res) => {
  if (!transporter)
    return res.status(503).json({ message: 'SMTP no disponible.' });

  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: { surgicalConsent: true, anesthesiaConsent: true },
  });
  if (!patient?.email) return res.status(404).json({ message: 'Sin e‑mail.' });

  /* Adjuntos */
  
  const attachments: nodemailer.SendMailOptions['attachments'] = [];

  for (const c of [patient.surgicalConsent, patient.anesthesiaConsent]) {
    if (c)
      attachments.push({
        filename: c.fileName,
        path: c.filePath,
        contentType: 'application/pdf',
      });
  }
  if (!attachments.length)
    return res.status(400).json({ message: 'Sin consentimientos.' });

  /* URL portal con email pre‑relleno */
  const portalUrl =
    `${process.env.PUBLIC_BASE_URL || req.protocol + '://' + req.get('host')}` +
    `/#patient?email=${encodeURIComponent(patient.email)}`;

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME ?? 'Gestor de Consentimientos'}" <${process.env.EMAIL_FROM}>`,
    to: patient.email,
    subject: 'Consentimientos y próximos pasos',
    html: `
    <div style="font-family:sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin:0 0 0.5em">Hola&nbsp;${patient.firstName},</h2>
      <p>Adjuntamos tus consentimientos pre‑operatorios.</p>

      <h3 style="margin:1.5em 0 0.4em">Cómo ingresar a la plataforma</h3>
      <ol style="padding-left:1.2em">
        <li>
          Pulsa: <a href="${portalUrl}" style="color:#2563eb">${portalUrl}</a>
        </li>
        <li>
          Usuario: <em>${patient.email}</em><br>
          Contraseña: tu número de cédula.
        </li>
        <li>
          Instala la aplicación desde el menú de tu navegador para
          recibir notificaciones.
        </li>
      </ol>

      <h3 style="margin:1.5em 0 0.4em">¿Para qué sirve?</h3>
      <ul style="padding-left:1.2em;list-style:disc">
        <li>
          Ingresa la <strong>fecha/hora exacta</strong> de la cirugía cuando la
          confirme tu cirujano.
        </li>
        <li>
          Te avisaremos cuándo iniciar el ayuno y suspender medicación.
        </li>
        <li>
          Podrás firmar electrónicamente cualquier consentimiento pendiente.
        </li>
      </ul>

      <p style="margin-top:1.5em">
        Gracias por tu colaboración.<br>
        <strong>Tu&nbsp;Equipo&nbsp;Médico</strong>
      </p>
    </div>
    `,
    attachments,
  });

  res.json({ message: 'Correo enviado' });
});

/* === IA Gemini – sugerencia de suspensiones === */
app.post('/api/ai/generate-medication-instructions', async (req, res) => {
  const { medications, surgicalProcedure } = req.body;
  if (!medications || !surgicalProcedure)
    return res.status(400).json({ message: 'Faltan datos.' });

  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Un paciente que toma "${medications}" será operado de "${surgicalProcedure}". Genera instrucciones sobre qué medicamentos suspender, respuesta en JSON.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            instructionsText: { type: Type.STRING },
            medicationsToSuspend: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['instructionsText', 'medicationsToSuspend'],
        },
      },
    });

    res.json(JSON.parse(resp.text || '{}'));
  } catch (e) {
    console.error('AI error:', e);
    res.status(500).json({ message: 'Fallo IA.' });
  }
});

/* ─── FASTING PLAN (1‑a‑1) ─────────────────────────────────── */
app.get('/api/patients/:id/fasting-plan', async (req, res) => {
  const plan = await prisma.fastingPlan.findUnique({
    where: { patientId: req.params.id },
  });
  if (!plan) return res.status(404).json({ message: 'Sin plan.' });
  res.json(plan);
});

app.put('/api/patients/:id/fasting-plan', async (req, res) => {
  const data = req.body as UpsertFastingPlanDTO;
  try {
    const plan = await prisma.fastingPlan.upsert({
      where: { patientId: req.params.id },
      create: { ...data, patientId: req.params.id },
      update: data,
    });

    await schedulePatientNotification(
      req.params.id,
      'Comenzar ayuno',
      'Debes iniciar el ayuno ahora.',
      data.startAt,
    );

    res.json(plan);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al guardar.' });
  }
});

/* ─── SUSPENSIONS (1‑a‑N) ──────────────────────────────────── */
app.get('/api/patients/:id/suspensions', async (req, res) => {
  const list = await prisma.suspension.findMany({
    where: { patientId: req.params.id },
    orderBy: { suspendAt: 'asc' },
  });
  res.json(list);
});

app.post('/api/patients/:id/suspensions', async (req, res) => {
  const dto = req.body as CreateSuspensionDTO;
  try {
    const susp = await prisma.suspension.create({
      data: { ...dto, patientId: req.params.id },
    });

    await schedulePatientNotification(
      req.params.id,
      `Suspender ${dto.medicationName}`,
      'Es momento de suspender este medicamento.',
      dto.suspendAt,
    );

    if (dto.resumeAt) {
      await schedulePatientNotification(
        req.params.id,
        `Reanudar ${dto.medicationName}`,
        'Puedes volver a tomar tu medicamento.',
        dto.resumeAt,
      );
    }

    res.status(201).json(susp);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al crear.' });
  }
});

app.delete('/api/patients/:id/suspensions/:suspId', async (req, res) => {
  try {
    await prisma.suspension.delete({ where: { id: req.params.suspId } });
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al borrar.' });
  }
});

/* ──────────────────────────────────────────────────────────────
   Arranque
────────────────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`🚀  Backend listo en http://localhost:${PORT}`),
);
