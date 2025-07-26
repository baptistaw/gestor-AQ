

import Prisma from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { PrismaClient } = Prisma;
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

async function seedConsentForms(type: 'SURGICAL' | 'ANESTHESIA') {
    const folder = type.toLowerCase();
    const directoryPath = path.join(uploadsDir, folder);
    
    try {
        await fs.access(directoryPath);
        const files = await fs.readdir(directoryPath);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            console.log(`No PDFs found in ${directoryPath}. Skipping seeding for ${type}.`);
            return;
        }

        for (const fileName of pdfFiles) {
            const filePath = path.join(directoryPath, fileName);
            const fileContent = await fs.readFile(filePath);

            const existingForm = await prisma.consentForm.findFirst({
                where: { fileName, type }
            });

            if (existingForm) {
                await prisma.consentForm.update({
                    where: { id: existingForm.id },
                    data: { fileContent },
                });
                console.log(`Updated form: ${fileName}`);
            } else {
                await prisma.consentForm.create({
                    data: {
                        fileName,
                        fileContent,
                        type,
                    }
                });
                console.log(`Created form: ${fileName}`);
            }
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.error(`Directory not found: ${directoryPath}`);
            console.error(`Please create it and add your PDF forms.`);
        } else {
            console.error(`Error seeding ${type} forms:`, error);
        }
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

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });