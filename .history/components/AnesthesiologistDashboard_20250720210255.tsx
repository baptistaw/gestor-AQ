/* -------------------------------------------------------------
   Panel del Anestesiólogo con QR sin “qrcode.react”
   ------------------------------------------------------------- */

import * as React from "react";
const { useState, useCallback, useEffect, useMemo } = React;

import {
  Patient,
  Anesthesiologist,
  ConsentData,
} from "../types.ts";
import { AddAnesthesiaConsentData } from "../App.tsx";

/* Iconos hero‑icons personalizados --------------------------- */
import {
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentPlusIcon,
  UserIcon,
  BellAlertIcon,
  SparklesIcon,
  EnvelopeIcon,
  QrCodeIcon,
} from "./icons.tsx";

/*  Nuevo helper que genera un <img> a partir de “qrcode”  */
import { QRImg } from "./QRImg.tsx";

import Modal from "./Modal.tsx";

/* ---------- Props de alto nivel ----------------------------- */
interface AnesthesiologistDashboardProps {
  patients: Patient[];
  anesthesiologist: Anesthesiologist;
  onAddAnesthesiaConsent: (
    patientId: string,
    data: AddAnesthesiaConsentData
  ) => void;
  onLogout: () => void;
  isLoading: boolean;
  apiUrl: string;
}

/* ---------- Ayudas para ayuno ------------------------------- */
const fastingOptions = {
  solids: ["6 horas", "8 horas"],
  clearLiquids: ["2 horas", "4 horas", "6 horas"],
  cowMilk: ["6 horas", "8 horas"],
  breastMilk: ["4 horas", "6 horas"],
};

/* ---------- Formulario modal para crear consentimiento ------ */
const AddAnesthesiaConsentForm: React.FC<{
  patient: Patient;
  apiUrl: string;
  onSave: (data: AddAnesthesiaConsentData) => void;
  onCancel: () => void;
}> = ({ patient, apiUrl, onSave, onCancel }) => {
  const [consentFormId, setConsentFormId] = useState("");
  const [consentForms, setConsentForms] = useState<ConsentData[]>([]);
  const [instructions, setInstructions] = useState("");
  const [isInfant, setIsInfant] = useState(false);
  const [fasting, setFasting] = useState({
    solids: "",
    clearLiquids: "",
    cowMilk: "",
    breastMilk: "",
  });
  const [medicationToSuspend, setMedicationToSuspend] = useState<string[]>([]);
  const [patientMedications, setPatientMedications] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  /* Cargar PDFs de consentimiento de anestesia --------------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `${apiUrl}/api/consent-forms?type=anesthesia`
        );
        if (!r.ok) throw new Error("No se pudo leer la lista");
        const data: ConsentData[] = await r.json();
        setConsentForms(data);
        if (data[0]) setConsentFormId(data[0].id);
      } catch (e: any) {
        setError(
          "No se pudo obtener el listado de formularios de anestesia."
        );
      }
    })();
  }, [apiUrl]);

  /* Llamada a la IA para generar instrucciones ---------------- */
  const handleGenerateInstructions = async () => {
    if (!patientMedications) {
      setError("Primero ingresa la medicación actual del paciente.");
      return;
    }
    setIsGenerating(true);
    try {
      const r = await fetch(
        `${apiUrl}/api/ai/generate-medication-instructions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medications: patientMedications,
            surgicalProcedure: patient.surgicalProcedure,
          }),
        }
      );
      if (!r.ok) throw new Error(await r.text());
      const { instructionsText, medicationsToSuspend } = await r.json();
      setInstructions((prev) =>
        prev ? `${prev}\n\n${instructionsText}` : instructionsText
      );
      setMedicationToSuspend(medicationsToSuspend);
    } catch (e: any) {
      setError(`IA Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /* Enviar el formulario ------------------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentFormId) {
      setError("Selecciona un PDF de consentimiento.");
      return;
    }
    onSave({
      consentFormId,
      instructions,
      fastingInstructions: {
        isInfant,
        solids: fasting.solids,
        clearLiquids: fasting.clearLiquids,
        cowMilk: isInfant ? fasting.cowMilk : undefined,
        breastMilk: isInfant ? fasting.breastMilk : undefined,
      },
      medicationToSuspend,
    });
  };

  /* ---- JSX del formulario ---------------------------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg"
    >
      <h2 className="text-xl font-bold mb-2">
        Añadir Consentimiento – {patient.firstName} {patient.lastName}
      </h2>
      {error && (
        <p className="text-red-600 bg-red-50 p-2 rounded mb-2 text-sm">
          {error}
        </p>
      )}

      {/*  … resto del formulario exactamente igual a tu versión … */}
      {/*  (se omitió aquí por brevedad; copia tu bloque original)  */}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-md shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
          disabled={consentForms.length === 0}
        >
          Guardar y Enviar
        </button>
      </div>
    </form>
  );
};

/* ---------- Dashboard principal ----------------------------- */
const AnesthesiologistDashboard: React.FC<
  AnesthesiologistDashboardProps
> = ({
  anesthesiologist,
  patients,
  onAddAnesthesiaConsent,
  onLogout,
  isLoading,
  apiUrl,
}) => {
  /* Estados de UI */
  const [consentPatient, setConsentPatient] = useState<Patient | null>(
    null
  ); // para formulario
  const [qrPatient, setQrPatient] = useState<Patient | null>(null); // para QR

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "action-required" | "archived"
  >("all");

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(
    null
  );
  const [emailStatus, setEmailStatus] = useState<{ [k: string]: string }>(
    {}
  );
  // 🔗 Construye la URL que precarga el e‑mail del paciente en el login
  const buildPortalUrl = (p: Patient) =>
    `${window.location.origin}/#patient?email=${encodeURIComponent(p.email)}`;

  /* Helper Email ------------------------------------------------ */
  const handleSendEmail = useCallback(
    async (patientId: string, patientEmail: string) => {
      if (
        !confirm(
          `¿Enviar los consentimientos a la cuenta ${patientEmail}?`
        )
      )
        return;

      setSendingEmailId(patientId);
      try {
        const r = await fetch(
          `${apiUrl}/api/patients/${patientId}/send-consent-email`,
          { method: "POST" }
        );
        const msg = (await r.json()).message || r.statusText;
        setEmailStatus((s) => ({ ...s, [patientId]: msg }));
      } catch (e: any) {
        setEmailStatus((s) => ({ ...s, [patientId]: "Error" }));
      } finally {
        setSendingEmailId(null);
        setTimeout(() => {
          setEmailStatus((s) => ({ ...s, [patientId]: "" }));
        }, 4000);
      }
    },
    [apiUrl]
  );

  /* Filtro de pacientes ---------------------------------------- */
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        if (filterStatus === "action-required") return p.isActionRequired;
        if (filterStatus === "archived") return p.isArchived;
        return !p.isArchived;
      })
      .filter((p) => {
        const s = searchTerm.toLowerCase();
        return (
          s === "" ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(s) ||
          p.cedula.toLowerCase().includes(s)
        );
      });
  }, [patients, searchTerm, filterStatus]);

  /* -------------------- RENDER -------------------------------- */
  return (
    <>
      {/* -------- Cabecera ------------- */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Panel del Anestesiólogo
          </h1>
          <p className="text-slate-600">
            Dr(a). {anesthesiologist.firstName}{" "}
            {anesthesiologist.lastName} — Mat.{" "}
            {anesthesiologist.professionalLicenseNumber}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white"
        >
          Cerrar sesión <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </header>

      {/* -------- Buscador / filtros ---- */}
      {/*  … (tu sección de buscador sin cambios) … */}

      {/* -------- Listado --------------- */}
      <section className="space-y-3">
        {isLoading ? (
          <p>Cargando pacientes…</p>
        ) : filteredPatients.length === 0 ? (
          <p className="text-slate-500">Sin resultados.</p>
        ) : (
          filteredPatients.map((p) => (
            <div
              key={p.id}
              className={`p-4 bg-slate-50/50 border rounded-lg flex flex-col sm:flex-row justify-between gap-3 ${
                p.isArchived ? "opacity-60" : ""
              }`}
            >
              {/*  Datos principales  */}
              <div className="flex-1 flex gap-3">
                {p.isActionRequired && (
                  <BellAlertIcon className="h-6 w-6 text-amber-500 flex-shrink-0" />
                )}
                <div>
                  <p className="font-bold">
                    {p.lastName}, {p.firstName}{" "}
                    <span className="text-sm text-slate-500">
                      ({p.age} a)
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Proc.: {p.surgicalProcedure || "N/D"}
                  </p>
                </div>
              </div>

              {/*  Botones de acción  */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Email */}
                <button
                  onClick={() => handleSendEmail(p.id, p.email)}
                  disabled={sendingEmailId === p.id}
                  className="inline-flex gap-1.5 items-center px-3 py-1 rounded-full text-sm shadow-sm text-white bg-slate-600 hover:bg-slate-700"
                  title="Enviar PDFs al paciente"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  {emailStatus[p.id] || "Email"}
                </button>

                {/* QR */}
                <button
                  onClick={() => setQrPatient(p)}
                  className="inline-flex gap-1.5 items-center px-3 py-1 rounded-full text-sm shadow-sm text-white bg-slate-600 hover:bg-slate-700"
                  title="Mostrar QR"
                >
                  <QrCodeIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">QR</span>
                </button>

                {/* Añadir consentimiento (si falta) */}
                {p.anesthesiaConsent ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-4 w-4" /> Completo
                  </span>
                ) : (
                  <button
                    onClick={() => setConsentPatient(p)}
                    className="inline-flex gap-1.5 items-center px-3 py-1 rounded-full text-sm shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <DocumentPlusIcon className="h-4 w-4" />
                    Añadir
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* -------- Modal: consentimiento ------------------------ */}
      {consentPatient && (
        <Modal onClose={() => setConsentPatient(null)}>
          <AddAnesthesiaConsentForm
            patient={consentPatient}
            apiUrl={apiUrl}
            onSave={(data) => {
              onAddAnesthesiaConsent(consentPatient.id, data);
              setConsentPatient(null);
            }}
            onCancel={() => setConsentPatient(null)}
          />
        </Modal>
      )}

      {/* -------- Modal: QR ------------------------------------ */}
      {qrPatient && (
        <Modal onClose={() => setQrPatient(null)}>
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm mx-auto">
            <h3 className="text-xl font-bold">
              Acceso para {qrPatient.firstName}
            </h3>
            <p className="text-slate-600 mt-2 mb-4">
              Escanee este código con el móvil del paciente.
            </p>
            <div className="p-4 border rounded-lg inline-block">
              <QRImg
                text={`${window.location.origin}#patient`}
                size={256}
              />
            </div>
            <button
              onClick={() => setQrPatient(null)}
              className="mt-6 w-full px-4 py-2 rounded-md shadow-sm bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AnesthesiologistDashboard;
