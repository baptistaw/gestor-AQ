/*
  Warnings:

  - You are about to drop the column `anesthesiaConsentPDFName` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `surgicalConsentPDFName` on the `Patient` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[surgicalConsentId]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[anesthesiaConsentId]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('SURGICAL', 'ANESTHESIA');

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "anesthesiaConsentPDFName",
DROP COLUMN "surgicalConsentPDFName",
ADD COLUMN     "anesthesiaConsentId" TEXT,
ADD COLUMN     "surgicalConsentId" TEXT;

-- CreateTable
CREATE TABLE "ConsentForm" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileContent" BYTEA NOT NULL,
    "type" "ConsentType" NOT NULL,

    CONSTRAINT "ConsentForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_surgicalConsentId_key" ON "Patient"("surgicalConsentId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_anesthesiaConsentId_key" ON "Patient"("anesthesiaConsentId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_surgicalConsentId_fkey" FOREIGN KEY ("surgicalConsentId") REFERENCES "ConsentForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_anesthesiaConsentId_fkey" FOREIGN KEY ("anesthesiaConsentId") REFERENCES "ConsentForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
