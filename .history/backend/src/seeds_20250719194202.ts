import Prisma from '@prisma/client';

const { PrismaClient } = Prisma;
const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Seed Surgeon
    const surgeon = await prisma.surgeon.upsert({
        where: { professionalLicenseNumber: 'CIR12345' },
        update: {},
        create: {
            firstName: 'Carlos',
            lastName: 'García',
            professionalLicenseNumber: 'CIR12345',
            password: 'password123',
            specialty: 'Cirugía General',
        },
    });
    console.log(`Created surgeon: Dr. ${surgeon.firstName} ${surgeon.lastName} (ID: ${surgeon.id})`);

    // Seed Anesthesiologist
    const anesthesiologist = await prisma.anesthesiologist.upsert({
        where: { professionalLicenseNumber: 'ANE67890' },
        update: {},
        create: {
            firstName: 'Ana',
            lastName: 'Martínez',
            professionalLicenseNumber: 'ANE67890',
            password: 'password123',
        },
    });
    console.log(`Created anesthesiologist: Dr(a). ${anesthesiologist.firstName} ${anesthesiologist.lastName} (ID: ${anesthesiologist.id})`);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error("Error during seeding:", e);
        (process as any).exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });