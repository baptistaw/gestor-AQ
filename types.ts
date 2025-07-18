export interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  professionalLicenseNumber: string;
}

export interface Surgeon extends Professional {
  specialty: string;
}

export interface Anesthesiologist extends Professional {}

export interface FastingInstructions {
  isInfant: boolean;
  solids?: string;
  clearLiquids?: string;
  cowMilk?: string;
  breastMilk?: string;
}

export interface Patient {
  id:string;
  // New personal info
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO string
  sex: 'Masculino' | 'Femenino' | 'Otro';
  age: number; // Calculated on backend

  email: string;
  cedula: string; // National ID, also used as password for the patient

  // Surgical Consent Info
  surgicalConsentPDFName: string | null;
  surgicalProcedure: string | null;
  surgeryDateTime: string | null; // ISO String
  surgeonId: string | null;
  surgeon: Surgeon | null; // Populated by backend
  surgicalSignatureImage: string | null;
  surgicalSignedDate: string | null; // ISO String

  // Anesthesia Consent Info
  anesthesiaConsentPDFName: string | null;
  anesthesiaInstructions: string | null;
  fastingInstructions: FastingInstructions;
  medicationToSuspend: string[];
  anesthesiologistId: string | null;
  anesthesiologist: Anesthesiologist | null; // Populated by backend
  anesthesiaSignatureImage: string | null;
  anesthesiaSignedDate: string | null; // ISO String
  
  // Computed properties from backend
  isActionRequired: boolean;
  isArchived: boolean;
}

export enum View {
  Landing = 'LANDING',
  AnesthesiologistLogin = 'ANESTHESIOLOGIST_LOGIN',
  AnesthesiologistDashboard = 'ANESTHESIOLOGIST_DASHBOARD',
  SurgeonLogin = 'SURGEON_LOGIN',
  SurgeonDashboard = 'SURGEON_DASHBOARD',
  PatientLogin = 'PATIENT_LOGIN',
  PatientConsent = 'PATIENT_CONSENT_VIEW',
}