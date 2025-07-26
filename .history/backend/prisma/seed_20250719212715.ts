import * as Prisma from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new Prisma.PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

async function seedConsentForms(type: 'SURGICAL' | 'ANESTHESIA') {
    const folder = type.toLowerCase();
    const directoryPath = path.resolve(uploadsDir, folder);
    
    try {
        await fs.access(directoryPath);
        const files = await fs.readdir(directoryPath);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            console.log(`No PDFs found in ${directoryPath}. Skipping seeding for ${type}.`);
            return;
        }

        for (const fileName of pdfFiles) {
            const filePath = path.resolve(directoryPath, fileName);
            console.log('Leyendo PDF:', filePath);
            const fileContent = await fs.readFile(filePath);

            const existingForm = await prisma.consentForm.findFirst({
                where: { fileName, type }
            });

            if (existingForm) {
                await prisma.consentForm.update({
                    where: { id: existingForm.id },
                    data: { fileContent },
                });
            } else {
                await prisma.consentForm.create({
                    data: {
                        fileName,
                        fileContent,
                        type,
                    }
                });
            }
            console.log(`✓ Formulario “${fileName}” almacenado`);
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.error(`Directory not found: ${directoryPath}`);
            console.error(`Please create it and add your PDF forms.`);
        } else {
            console.error(`Error seeding ${type} forms:`, error);
        }
        throw error;
    }
}


async function main() {
  console.log(`Start seeding ...`);

  // Create Professionals
  const surgeon1 = await prisma.surgeon.upsert({
    where: { professionalLicenseNumber: 'S-12345' },
    update: {},
    create: {
      firstName: 'Maria',
      lastName: 'García',
      professionalLicenseNumber: 'S-12345',
      password: 'password123',
      specialty: 'Cirugía General'
    },
  });
  console.log(`Created/verified surgeon with id: ${surgeon1.id}`);
  console.log(`-> Login with license 'S-12345' and password 'password123'`);

  const anesthesiologist1 = await prisma.anesthesiologist.upsert({
    where: { professionalLicenseNumber: 'A-54321' },
    update: {},
    create: {
      firstName: 'Juan',
      lastName: 'Pérez',
      professionalLicenseNumber: 'A-54321',
      password: 'password123',
    },
  });
  console.log(`Created/verified anesthesiologist with id: ${anesthesiologist1.id}`);
  console.log(`-> Login with license 'A-54321' and password 'password123'`);
  
  // Seed consent forms from files
  console.log('\nSeeding Consent Forms...');
  await seedConsentForms('SURGICAL');
  await seedConsentForms('ANESTHESIA');

  console.log(`\nSeeding finished.`);
}

(async () => {
    try {
        await main();
        await prisma.$disconnect();
        console.log('Seeding finished ✅');
        (process as any).exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        await prisma.$disconnect();
        (process as any).exit(1);
    }
})();