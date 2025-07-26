/* ──────────────────────────────────────────────────────────────
   Dependencias principales
────────────────────────────────────────────────────────────── */
import express, { Request, Response, NextFunction } from 'express';
import cors            from 'cors';
import dotenv          from 'dotenv';
import path            from 'path';
import { fileURLToPath } from 'url';
import fs              from 'fs/promises';
import * as babel      from '@babel/core';

import { PrismaClient, ConsentType, type Patient } from '@prisma/client';
import { GoogleGenAI, Type }                       from '@google/genai';
import nodemailer                                  from 'nodemailer';

import {
  UpsertFastingPlanDTO,
  CreateSuspensionDTO,
  AdminLoginDTO,
  CreateProviderDTO,
  CreateProfessionalDTO,
  AddPatientAndSurgicalConsentData
} from './types.tsx';
import { schedulePatientNotification } from './notify.js';

/* ──────────────────────────────────────────────────────────────
   Inicialización
────────────────────────────────────────────────────────────── */
dotenv.config();
for (const v of ['DATABASE_URL', 'API_KEY'])
  if (!process.env[v]) { console.error(`❌ Falta ${v}`); process.exit(1); }

const prisma = new PrismaClient();
const ai     = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const app    = express();
const PORT   = Number(process.env.PORT) || 4000;

/* ──────────────────────────────────────────────────────────────
   SMTP
────────────────────────────────────────────────────────────── */
let transporter: nodemailer.Transporter | null = null;
if (
  ['EMAIL_HOST','EMAIL_PORT','EMAIL_USER','EMAIL_PASS','EMAIL_FROM']
    .every(k => !!process.env[k])
) {
  transporter = nodemailer.createTransport({
    host  : process.env.EMAIL_HOST,
    port  : Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth  : { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  transporter.verify()
    .then(() => console.log('📧 SMTP listo'))
    .catch(e => console.error('❌ Error SMTP:', e));
} else {
  console.warn('⚠️  SMTP no configurado – envío de mails deshabilitado.');
}

/* ──────────────────────────────────────────────────────────────
   Middleware global
────────────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/* ──────────────────────────────────────────────────────────────
   Archivos estáticos  + hot‑reload TSX del frontend
────────────────────────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const publicDir  = path.join(__dirname, '..', 'public');

/*   ↳ solo en dev: compila .ts / .tsx del front on‑the‑fly */
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!/\.(ts|tsx)$/.test(req.path)) return next();
  const filePath = path.join(publicDir, req.path);
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
    if (err.code === 'ENOENT') return next(); // deja que express.static mande 404
    console.error('Babel error:', err);
    next(err);
  }
});
app.use(express.static(publicDir));

 -------- Config global que necesita el frontend -------- */
app.get("/config.js", (_req, res) => {
  res
    .type("application/javascript")
    .send(`
      window.CONFIG = {
        API_BASE_URL: "/api",
+        PUBLIC_BASE_URL: "${process.env.PUBLIC_BASE_URL ?? ""}"
+      };
+    `);
+});
/* ──────────────────────────────────────────────────────────────
   Utilidades comunes
────────────────────────────────────────────────────────────── */
const calculateAge = (dob: string | Date) =>
  Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970);

const patientInclude = {
  surgeon: true,
  anesthesiologist: true,
  surgicalConsent : { select:{ id:true,fileName:true,filePath:true } },
  anesthesiaConsent:{ select:{ id:true,fileName:true,filePath:true } },
  provider: true,
} as const;

const isActionRequired = (p: any) => {
  if (!p || !p.surgeryDateTime || p.isArchived) return false;
  const surgeryDate = new Date(p.surgeryDateTime);
  const limit = new Date(); limit.setDate(limit.getDate()+2);
  const needsSign = !p.surgicalSignatureImage ||
                    (p.anesthesiaConsent && !p.anesthesiaSignatureImage);
  return surgeryDate <= limit && needsSign;
};

const processPatient = (
  patient: (Patient & { surgicalConsent:any; anesthesiaConsent:any }) | null
) => {
  if (!patient) return null;
  const processed: any = {
    ...patient,
    age       : calculateAge(patient.dateOfBirth),
    isArchived: patient.surgeryDateTime
      ? new Date(patient.surgeryDateTime) < new Date()
      : false,
  };
  processed.isActionRequired = isActionRequired(processed);
  return processed;
};

const stripPassword = <T extends { password?:string }>(obj:T) => {
  const { password, ...rest } = obj as any; return rest as T;
};

/* ──────────────────────────────────────────────────────────────
   RUTAS API
────────────────────────────────────────────────────────────── */

/* -------- 1. Admin login (una sola vez) ---------------------- */
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body as AdminLoginDTO;
  try {
    const admin = await prisma.admin.findUnique({ where:{ email } });
    if (!admin || admin.password !== password)
      return res.status(401).json({ message:'Credenciales inválidas' });
    res.json(stripPassword(admin));
  } catch (e) {
    console.error(e); res.status(500).json({ message:'Error servidor' });
  }
});

/* -------- 2. Formularios de consentimiento ------------------ */
app.get('/api/consent-forms', async (req,res) => {
  const type = (req.query.type as string)?.toUpperCase();
  if (!['SURGICAL','ANESTHESIA'].includes(type||''))
    return res.status(400).json({ message:'Tipo inválido' });
  const forms = await prisma.consentForm.findMany({
    where:{ type:type as ConsentType },
    select:{ id:true,fileName:true },
    orderBy:{ fileName:'asc' }
  });
  res.json(forms);
});
app.get('/api/consent-forms/:id/pdf', async (req,res)=>{
  const f = await prisma.consentForm.findUnique({
    where:{ id:req.params.id }, select:{ filePath:true,fileName:true }
  });
  if (!f) return res.status(404).json({ message:'No encontrado' });
  res.type('application/pdf')
     .setHeader('Content-Disposition',`inline; filename="${f.fileName}"`)
     .sendFile(f.filePath);
});

/* -------- 3. Login profesionales & pacientes ---------------- */
const handleProfessionalLogin = async (
  req:Request,res:Response, model:'surgeon'|'anesthesiologist'
) => {
  const { professionalLicenseNumber,password } = req.body;
  const professional = model==='surgeon'
    ? await prisma.surgeon.findUnique({ where:{ professionalLicenseNumber } })
    : await prisma.anesthesiologist.findUnique({ where:{ professionalLicenseNumber } });
  if (professional && professional.password===password)
    res.json(stripPassword(professional));
  else res.status(401).json({ message:'Credenciales incorrectas' });
};
app.post('/api/surgeons/login',          (r,s)=>handleProfessionalLogin(r,s,'surgeon'));
app.post('/api/anesthesiologists/login', (r,s)=>handleProfessionalLogin(r,s,'anesthesiologist'));

app.post('/api/login', async (req,res)=>{
  const { email, cedula } = req.body;
  const patient = await prisma.patient.findFirst({ where:{ email }, include:patientInclude });
  if (patient?.cedula===cedula) res.json(processPatient(patient));
  else res.status(401).json({ message:'Credenciales inválidas' });
});

/* -------- 4. Prestadores ------------------------------------ */
app.get('/api/providers', async (_,_res)=> {
  const list = await prisma.healthProvider.findMany({ orderBy:{ name:'asc' }});
  _.json(list);
});
app.post('/api/providers', async (req,res)=>{
  try{
    const created = await prisma.healthProvider.create({ data:req.body as CreateProviderDTO });
    res.status(201).json(created);
  }catch(e){ console.error(e); res.status(400).json({ message:'Error al crear' }); }
});
app.post('/api/providers/:id/add-professional', async (req,res)=>{
  const { professionalId, role } = req.body as { professionalId:string; role:'SURGEON'|'ANESTHESIOLOGIST' };
  try{
    if (role==='SURGEON'){
      await prisma.surgeon.update({ where:{ id:professionalId }, data:{ providers:{ connect:{ id:req.params.id }}}});
    }else{
      await prisma.anesthesiologist.update({ where:{ id:professionalId }, data:{ providers:{ connect:{ id:req.params.id }}}});
    }
    res.sendStatus(204);
  }catch(e){ console.error(e); res.status(400).json({ message:'No se pudo vincular' }); }
});

/* -------- 5. Pacientes -------------------------------------- */
app.get('/api/patients', async (_,_res)=>{
  const list = await prisma.patient.findMany({ include:patientInclude, orderBy:{ surgeryDateTime:'desc' }});
  _.json(list.map(p=>processPatient(p)));
});
app.post('/api/patients', async (req,res)=>{
  const {
    firstName,lastName,email,cedula,dateOfBirth,sex,
    consentFormId,surgicalProcedure,surgeryDateTime,surgeonId,providerId,
  } = req.body as AddPatientAndSurgicalConsentData & { providerId?:string };
  try{
    const created = await prisma.patient.create({
      data:{
        firstName,lastName,email,cedula,
        dateOfBirth:new Date(dateOfBirth),
        sex,surgicalProcedure,surgeryDateTime,
        surgeon:{ connect:{ id:surgeonId } },
        surgicalConsent:{ connect:{ id:consentFormId } },
        ...(providerId && { provider:{ connect:{ id:providerId } }})
      }, include:patientInclude
    });
    res.status(201).json(processPatient(created));
  }catch(e:any){
    if (e.code==='P2002') return res.status(409).json({ message:'Email o cédula duplicados' });
    console.error(e); res.status(500).json({ message:'Error al crear paciente' });
  }
});

/* -------- 6. Consentimiento anestesia & firmas -------------- */
app.put('/api/patients/:id/anesthesia-consent', async (req,res)=>{
  const { id } = req.params;
  const { consentFormId,instructions,medicationToSuspend,anesthesiologistId } = req.body;
  try{
    const updated = await prisma.patient.update({
      where:{ id }, data:{
        anesthesiaConsent:{ connect:{ id:consentFormId } },
        anesthesiaInstructions: instructions,
        medicationToSuspend,
        anesthesiologist:{ connect:{ id:anesthesiologistId } }
      }, include:patientInclude
    });
    res.json(processPatient(updated));
  }catch(e){ console.error(e); res.status(500).json({ message:'Error al añadir consentimiento' }); }
});

const handleSign = async (req:Request,res:Response,type:'surgical'|'anesthesia')=>{
  const { id } = req.params;
  const { signatureImage } = req.body;
  const data = type==='surgical'
    ? { surgicalSignatureImage:signatureImage,   surgicalSignedDate:new Date() }
    : { anesthesiaSignatureImage:signatureImage, anesthesiaSignedDate:new Date() };
  const updated = await prisma.patient.update({ where:{ id }, data, include:patientInclude });
  res.json(processPatient(updated));
};
app.put('/api/patients/:id/sign-surgical',   (r,s)=>handleSign(r,s,'surgical'));
app.put('/api/patients/:id/sign-anesthesia', (r,s)=>handleSign(r,s,'anesthesia'));

/* -------- 7. Mail con consentimientos ----------------------- */
app.post('/api/patients/:id/send-consent-email', async (req,res)=>{
  if (!transporter) return res.status(503).json({ message:'SMTP no disponible' });
  const patient = await prisma.patient.findUnique({
    where:{ id:req.params.id },
    include:{ surgicalConsent:true, anesthesiaConsent:true }
  });
  if (!patient?.email) return res.status(404).json({ message:'Sin e‑mail' });

  const attachments: nodemailer.SendMailOptions['attachments'] = [];
  for (const c of [patient.surgicalConsent, patient.anesthesiaConsent])
    if (c) attachments.push({ filename:c.fileName, path:c.filePath, contentType:'application/pdf' });
  if (!attachments.length) return res.status(400).json({ message:'Sin consentimientos' });

  const portalUrl = `${process.env.PUBLIC_BASE_URL || req.protocol+'://'+req.get('host')}` +
                    `/#patient?email=${encodeURIComponent(patient.email)}`;

  await transporter.sendMail({
    from   : `"${process.env.EMAIL_FROM_NAME ?? 'Gestor de Consentimientos'}" <${process.env.EMAIL_FROM}>`,
    to     : patient.email,
    subject: 'Consentimientos y próximos pasos',
    html   : `<p>Hola <b>${patient.firstName}</b>, adjuntamos tus consentimientos…</p>
              <p>Accede: <a href="${portalUrl}">${portalUrl}</a> (contraseña = cédula).</p>`,
    attachments,
  });
  res.json({ message:'Correo enviado' });
});

/* -------- 8. IA Gemini -------------------------------------- */
app.post('/api/ai/generate-medication-instructions', async (req,res)=>{
  const { medications, surgicalProcedure } = req.body;
  if (!medications || !surgicalProcedure)
    return res.status(400).json({ message:'Faltan datos' });
  try{
    const resp = await ai.models.generateContent({
      model:'gemini-2.5-flash',
      contents:`Un paciente toma "${medications}" y será operado de "${surgicalProcedure}". Devuelve JSON con instrucciones ("instructionsText", "medicationsToSuspend[]").`,
      config :{
        responseMimeType:'application/json',
        responseSchema:{
          type:Type.OBJECT,
          properties:{
            instructionsText:{ type:Type.STRING },
            medicationsToSuspend:{ type:Type.ARRAY, items:{ type:Type.STRING } }
          },
          required:['instructionsText','medicationsToSuspend']
        }
      }
    });
    res.json(JSON.parse(resp.text || '{}'));
  }catch(e){ console.error(e); res.status(500).json({ message:'Fallo IA' }); }
});

/* -------- 9. Plan de ayuno (1‑1) ----------------------------- */
app.get('/api/patients/:id/fasting-plan', async (req,res)=>{
  const p = await prisma.fastingPlan.findUnique({ where:{ patientId:req.params.id }});
  p ? res.json(p) : res.status(404).json({ message:'Sin plan' });
});
app.put('/api/patients/:id/fasting-plan', async (req,res)=>{
  const data = req.body as UpsertFastingPlanDTO;
  try{
    const plan = await prisma.fastingPlan.upsert({
      where:{ patientId:req.params.id },
      create:{ ...data, patientId:req.params.id },
      update:{ ...data } as any
    });
    await schedulePatientNotification(req.params.id,'Comenzar ayuno','Debes iniciar el ayuno ahora.',data.startAt);
    res.json(plan);
  }catch(e){ console.error(e); res.status(500).json({ message:'Error al guardar' }); }
});

/* -------- 10. Suspensiones (1‑N) ----------------------------- */
app.get('/api/patients/:id/suspensions', async (req,res)=>{
  const list = await prisma.suspension.findMany({
    where:{ patientId:req.params.id }, orderBy:{ suspendAt:'asc' }
  });
  res.json(list);
});
app.post('/api/patients/:id/suspensions', async (req,res)=>{
  const dto = req.body as CreateSuspensionDTO;
  try{
    const susp = await prisma.suspension.create({ data:{ ...dto, patientId:req.params.id }});
    await schedulePatientNotification(req.params.id,`Suspender ${dto.medicationName}`,
      'Es momento de suspender este medicamento.',dto.suspendAt);
    if (dto.resumeAt){
      await schedulePatientNotification(req.params.id,`Reanudar ${dto.medicationName}`,
        'Puedes volver a tomar tu medicamento.',dto.resumeAt);
    }
    res.status(201).json(susp);
  }catch(e){ console.error(e); res.status(500).json({ message:'Error al crear' }); }
});
app.delete('/api/patients/:id/suspensions/:suspId', async (req,res)=>{
  try{ await prisma.suspension.delete({ where:{ id:req.params.suspId }});
       res.sendStatus(204);
  }catch(e){ console.error(e); res.status(500).json({ message:'Error al borrar' }); }
});

/* ──────────────────────────────────────────────────────────────
   Fallback SPA
────────────────────────────────────────────────────────────── */
app.get('*', (_req,res)=> res.sendFile(path.join(publicDir,'index.html')));

/* ──────────────────────────────────────────────
   Arranque
────────────────────────────────────────────────────────────── */
app.listen(PORT, ()=> console.log(`🚀  Backend listo en http://localhost:${PORT}`));
