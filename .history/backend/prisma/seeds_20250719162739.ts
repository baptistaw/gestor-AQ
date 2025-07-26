import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log(`Start seeding ...`);

    // Crear un cirujano de prueba
    const surgeon = await prisma.surgeon.upsert({
        where: { professionalLicenseNumber: 'cirujano1' },
        update: {},
        create: {
            firstName: 'Juan',
            lastName: 'Pérez',
            professionalLicenseNumber: 'cirujano1',
            password: 'password123', // En una app real, esto debería estar hasheado!
            specialty: 'Cirugía General'
        },
    });
    console.log(`Created surgeon with id: ${surgeon.id}`);
    
    // Crear un anestesiólogo de prueba
    const anesthesiologist = await prisma.anesthesiologist.upsert({
        where: { professionalLicenseNumber: 'anestesista1' },
        update: {},
        create: {
            firstName: 'Ana',
            lastName: 'Gómez',
            professionalLicenseNumber: 'anestesista1',
            password: 'password123', // En una app real, esto debería estar hasheado!
        },
    });
    console.log(`Created anesthesiologist with id: ${anesthesiologist.id}`);
    
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        (process as any).exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });