// ────────────────────────────────────────────────
//  Data Transfer Objects (DTO) sencillos
// ────────────────────────────────────────────────

export interface UpsertFastingPlanDTO {
  solids: string;
  clearLiquids: string;
  cowMilk?: string | null;
  breastMilk?: string | null;
  startAt: string;   // ISO
}

export interface CreateSuspensionDTO {
  medicationName: string;
  suspendAt: string; // ISO
  resumeAt?: string; // ISO | null
}

/* ---------- Auth ---------- */
export interface AdminLoginDTO {
  email: string;
  password: string;
}

/* ---------- Providers ------ */
export interface CreateProviderDTO {
  name:       string;
  address:    string;
  phone?:     string;
  contactEmail?: string;
}

/* ---------- Professionals -- */
export interface CreateProfessionalDTO {
  providerId: string;           // FK obligatoria
  role: 'SURGEON' | 'ANESTHESIOLOGIST';
  firstName: string;
  lastName:  string;
  license:   string;
  password:  string;
}

+export interface Admin {
+  id:        string;
+  email:     string;
+  firstName: string;
+  lastName:  string;
+}

+export interface HealthProvider {
+  id:   string;
+  name: string;
+}
