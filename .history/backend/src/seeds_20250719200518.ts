import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create a Surgeon
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
  console.log(`Created surgeon with id: ${surgeon1.id}`);
  console.log(`-> Login with license 'S-12345' and password 'password123'`);

  // Create an Anesthesiologist
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
  console.log(`Created anesthesiologist with id: ${anesthesiologist1.id}`);
  console.log(`-> Login with license 'A-54321' and password 'password123'`);


  console.log(`Seeding finished.`);
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