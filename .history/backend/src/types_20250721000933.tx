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
