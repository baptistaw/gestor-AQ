/* ────────────────────────────────────────────────────────────────
   MODELOS BÁSICOS (de Prisma → frontend)
──────────────────────────────────────────────────────────────── */

export interface HealthProvider {
  id:          string;
  name:        string;
  address?:    string;
  phone?:      string;
  contactEmail?: string;
}

/* ── Profesionales ────────────────────────────────────────────── */

export type ProfessionalRole = 'SURGEON' | 'ANESTHESIOLOGIST';

export interface BaseProfessional {
  id:        string;
  provider?: HealthProvider | null;   // puede atender en varios
  providerId?: string | null;         // FK principal (opcional)
  firstName: string;
  lastName:  string;
  license:   string;                  // matrícula / colegiatura
}

export interface Surgeon extends BaseProfessional {
  role: 'SURGEON';
  specialty: string;
}

export interface Anesthesiologist extends BaseProfessional {
  role: 'ANESTHESIOLOGIST';
}

export interface Admin {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
}

/* ── Paciente ─────────────────────────────────────────────────── */

export interface Patient {
  id:                 string;
  createdAt:          string;
  updatedAt:          string;
  firstName:          string;
  lastName:           string;
  email:              string;
  cedula:             string;
  dateOfBirth:        string;
  sex:                'Masculino' | 'Femenino' | 'Otro';
  age:                number;           // calculado en backend
  provider?:          HealthProvider | null;

  /* Cirugía */
  surgicalProcedure?: string | null;
  surgeryDateTime?:   string | null;

  /* Consentimientos */
  surgicalConsent?:   { id: string; fileName: string } | null;
  anesthesiaConsent?: { id: string; fileName: string } | null;
  surgicalSignatureImage?:   string | null;
  anesthesiaSignatureImage?: string | null;
  surgicalSignedDate?:   string | null;
  anesthesiaSignedDate?: string | null;

  /* Ayuno / medicación (nuevo) */
  isInfant?:             boolean;
  fastingInstructions?: {
    isInfant: boolean;
    solids?: string | null;
    clearLiquids?: string | null;
    cowMilk?: string | null;
    breastMilk?: string | null;
  };

  medicationToSuspend?: string[];

  /* Flags derivados (backend) */
  isActionRequired: boolean;
  isArchived:       boolean;

  /* Relaciones */
  surgeon?:          Surgeon | null;
  anesthesiologist?: Anesthesiologist | null;
}

/* ────────────────────────────────────────────────────────────────
   DATA‑TRANSFER OBJECTS (DTO)
──────────────────────────────────────────────────────────────── */

/* FastingPlan */
export interface UpsertFastingPlanDTO {
  solids:        string;
  clearLiquids:  string;
  cowMilk?:      string | null;
  breastMilk?:   string | null;
  startAt:       string;   // ISO
}

/* Suspensiones de medicación */
export interface CreateSuspensionDTO {
  medicationName: string;
  suspendAt:      string; // ISO
  resumeAt?:      string; // ISO | null
}

/* Auth */
export interface AdminLoginDTO {
  email:    string;
  password: string;
}

/* Alta / edición de entidades desde UI Admin */
export interface CreateProviderDTO {
  name:       string;
  address:    string;
  phone?:     string;
  contactEmail?: string;
}

export interface CreateProfessionalDTO {
  providerId: string;           // FK obligatoria
  role:       ProfessionalRole;
  firstName:  string;
  lastName:   string;
  license:    string;
  password:   string;
}

/* ────────────────────────────────────────────────────────────────
   Enumeración de vistas de la SPA
──────────────────────────────────────────────────────────────── */

export enum View {
  /* landing pública */
  Landing               = 'landing',

  /* Área Admin */
  AdminLogin            = 'adminLogin',
  AdminDashboard        = 'admin',

  /* Profesionales */
  SurgeonLogin          = 'surgeonLogin',
  SurgeonDashboard      = 'surgeon',
  AnesthesiologistLogin = 'anesthLogin',
  AnesthesiologistDashboard = 'anesth',

  /* Paciente */
  PatientLogin          = 'patientLogin',
  PatientConsent        = 'patient',
}
