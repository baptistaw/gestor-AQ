// prisma/seed.ts
// ─────────────────────────────────────────────────────────────
//  Seed de datos demo: Admin + Médicos + PDFs de consentimiento
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs   from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();

// Helpers de rutas absolutas
const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const uploadsDir  = path.resolve(__dirname, '..', 'uploads'); // ./backend/uploads

/*─────────────────────────────────────────────────────────────*
 *  1.  Formularios PDF
 *─────────────────────────────────────────────────────────────*/
async function seedConsentForms(type: 'SURGICAL' | 'ANESTHESIA') {
  const folder        = type.toLowerCase();                // surgical | anesthesia
  const directoryPath = path.resolve(uploadsDir, folder);

  try {
    // A) Verificamos que exista la carpeta
    await fs.access(directoryPath);

    // B) Filtramos solo .pdf
    const pdfFiles = (await fs.readdir(directoryPath))
      .filter(f => f.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.log(`⚠️  No hay PDFs en ${directoryPath}. Omitiendo ${type}.`);
      return;
    }

 for (const fileName of pdfFiles) {
  const absPath     = path.resolve(directoryPath, fileName);
  const relPath     = path.relative(uploadsDir, absPath);
  cconst stat     = await fs.stat(absPath);
+ const fileSize = stat.size;

  const existing = await prisma.consentForm.findFirst({
    where: { fileName, type },
  });

  if (existing) {
    await prisma.consentForm.update({
      where: { id: existing.id },
      data:  { fileContent, filePath: relPath, fileSize },
    });
  } else {
    await prisma.consentForm.create({
      data: {
        fileName,
        fileContent,
        filePath: relPath,
        fileSize,
        type,
      },
    });
  }
  console.log(`✓ Seeded "${fileName}" (${type})`);
}

  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.error(`❌ Carpeta no encontrada: ${directoryPath}`);
      console.error('   Crea la carpeta y coloca tus PDFs.');
    } else {
      console.error(`❌ Error seeding ${type}:`, err);
    }
    throw err;
  }
}

/*─────────────────────────────────────────────────────────────*
 *  2.  Profesionales demo + Admin
 *─────────────────────────────────────────────────────────────*/
async function seedProfessionals() {
  const surgeon1 = await prisma.surgeon.upsert({
    where:  { professionalLicenseNumber: 'S-12345' },
    update: {},
    create: {
      firstName: 'María',
      lastName:  'García',
      professionalLicenseNumber: 'S-12345',
      password:  'password123',
      specialty: 'Cirugía General',
    },
  });
  console.log(`→ Cirujano demo: S-12345 / password123  (id ${surgeon1.id})`);

  const anesth1 = await prisma.anesthesiologist.upsert({
    where:  { professionalLicenseNumber: 'A-54321' },
    update: {},
    create: {
      firstName: 'Juan',
      lastName:  'Pérez',
      professionalLicenseNumber: 'A-54321',
      password:  'password123',
    },
  });
  console.log(`→ Anestesiólogo demo: A-54321 / password123 (id ${anesth1.id})`);

  await prisma.admin.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: {
      email:     'admin@demo.com',
      password:  'admin123',
      firstName: 'Admin',
      lastName:  'Demo',
    },
  });
  console.log('→ Admin demo: admin@demo.com / admin123');
}

/*─────────────────────────────────────────────────────────────*
 *  3.  Orquestador
 *─────────────────────────────────────────────────────────────*/
async function main() {
  console.log('🌱  Start seeding …\n');

  await seedProfessionals();

  console.log('\n📄  Seeding Consent Forms …');
  await seedConsentForms('SURGICAL');
  await seedConsentForms('ANESTHESIA');

  console.log('\n✅  Seeding finished.');
}

/*─────────────────────────────────────────────────────────────*/
(async () => {
  try {
    await main();
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
