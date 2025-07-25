-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "sex" TEXT NOT NULL,
    "surgicalConsentPDFName" TEXT,
    "surgicalProcedure" TEXT,
    "surgeryDateTime" TIMESTAMP(3),
    "surgeonId" TEXT,
    "surgicalSignatureImage" TEXT,
    "surgicalSignedDate" TIMESTAMP(3),
    "anesthesiaConsentPDFName" TEXT,
    "anesthesiaInstructions" TEXT,
    "medicationToSuspend" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "anesthesiologistId" TEXT,
    "anesthesiaSignatureImage" TEXT,
    "anesthesiaSignedDate" TIMESTAMP(3),
    "isInfant" BOOLEAN NOT NULL DEFAULT false,
    "fastingSolids" TEXT,
    "fastingClearLiquids" TEXT,
    "fastingCowMilk" TEXT,
    "fastingBreastMilk" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surgeon" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "professionalLicenseNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,

    CONSTRAINT "Surgeon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anesthesiologist" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "professionalLicenseNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Anesthesiologist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_cedula_key" ON "Patient"("email", "cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Surgeon_professionalLicenseNumber_key" ON "Surgeon"("professionalLicenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Anesthesiologist_professionalLicenseNumber_key" ON "Anesthesiologist"("professionalLicenseNumber");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES "Surgeon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_anesthesiologistId_fkey" FOREIGN KEY ("anesthesiologistId") REFERENCES "Anesthesiologist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
