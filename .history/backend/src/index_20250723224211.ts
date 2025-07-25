/* ──────────────────────────────────────────────────────────────
   Dependencias principales
────────────────────────────────────────────────────────────── */
import express, { Request, Response, NextFunction } from 'express';
import cors   from 'cors';
import dotenv from 'dotenv';
import path   from 'path';
import { fileURLToPath } from 'url';
import fs     from 'fs/promises';
import * as babel from '@babel/core';

/*  ⬇  …EL RESTO DE TUS IMPORTS ORIGINALES (Prisma, Nodemailer, etc.) */
import { PrismaClient, ConsentType, type Patient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import nodemailer from 'nodemailer';
import {
  UpsertFastingPlanDTO,
  CreateSuspensionDTO,
  AdminLoginDTO,
  CreateProviderDTO,
  CreateProfessionalDTO
} from './types.tsx';
import { schedulePatientNotification } from './notify.js';

/* ──────────────────────────────────────────────────────────────
   Inicialización básica (sin cambios)
────────────────────────────────────────────────────────────── */
dotenv.config();
for (const v of ['DATABASE_URL', 'API_KEY'])
  if (!process.env[v]) { console.error(`❌ Falta ${v}`); process.exit(1); }

const prisma = new PrismaClient();
const ai     = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const app    = express();
const PORT   = process.env.PORT || 4000;

/* ──────────────────────────────────────────────────────────────
   SMTP (sin cambios)
────────────────────────────────────────────────────────────── */
let transporter: nodemailer.Transporter | null = null;
/* … tu bloque SMTP original … */

/* ──────────────────────────────────────────────────────────────
   Middleware global
────────────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/* ──────────────────────────────────────────────────────────────
   ***  NUEVO  ***  –  servidor de archivos estáticos + TSX hot‑reload
────────────────────────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* carpeta pública definitiva → backend/public */
const publicDir  = path.join(__dirname, '..', 'public');

/* Transpila .ts/.tsx del front en caliente (solo dev) */
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
    out?.code
      ? res.type('application/javascript').send(out.code)
      : next(new Error(`Babel no transformó ${req.path}`));
  } catch (err: any) {
    if (err.code === 'ENOENT') return next();
    console.error('Babel error:', err);
    next(err);
  }
});

/* Archivos estáticos (HTML, CSS, JS, PDF, imágenes…) */
app.use(express.static(publicDir));

/* ──────────────────────────────────────────────────────────────
   >>  TODAS TUS RUTAS /api  (SIN CAMBIOS) <<
────────────────────────────────────────────────────────────── */
/* !!! pega aquí TODO tu bloque de rutas API tal como lo tenías !!! */

/* ──────────────────────────────────────────────────────────────
   Fallback SPA  – para /, /index.html, /panel/*, etc.
────────────────────────────────────────────────────────────── */
app.get('*', (_req, res) =>
  res.sendFile(path.join(publicDir, 'index.html')),
);

/* ──────────────────────────────────────────────
   Arranque del servidor
────────────────────────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`🚀  Backend listo en http://localhost:${PORT}`),
);
