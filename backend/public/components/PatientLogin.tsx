/* ------------------------------------------------------------------
   Login del Paciente
   – Rellena automáticamente el e‑mail si viene en el hash QR
   ------------------------------------------------------------------ */

import * as React from "react";
const { useState, useEffect } = React;

/* ---------- Props que espera el componente ----------------------- */
interface PatientLoginProps {
  /** Función que intenta el login en tu App .tsx */
  onLogin: (email: string, cedula: string) => void;
  /** Muestra un mensaje de error si el login falla */
  errorMessage?: string | null;
  /** Permite desactivar el botón mientras la petición está en curso */
  isLoading?: boolean;
}

const PatientLogin: React.FC<PatientLoginProps> = ({
  onLogin,
  errorMessage,
  isLoading = false,
}) => {
  /* --------------------------------------------------------------
     1. Extraer ?email=… del hash (/#patient?email=foo@bar.com)
     -------------------------------------------------------------- */
  const [email, setEmail] = useState("");          // correo del paciente
  const [cedula, setCedula] = useState("");        // contraseña (cédula)
  const [info, setInfo] = useState<string | null>(null); // ayuda al usuario

  useEffect(() => {
    // Ej.:  location.hash === "#patient?email=juan@test.com"
    const [, query] = window.location.hash.split("?");
    if (query) {
      const params = new URLSearchParams(query);
      const qEmail = params.get("email");
      if (qEmail) {
        setEmail(qEmail);
        setInfo(
          "Su correo se ha rellenado automáticamente. " +
            "Use su número de cédula como contraseña."
        );
      }
    }
  }, []);

  /* 2. Submit ----------------------------------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !cedula) return;
    onLogin(email.trim(), cedula.trim());
  };

  /* 3. Render ----------------------------------------------------- */
  return (
    <div className="max-w-sm mx-auto bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-bold text-center mb-6">
        Acceso del Paciente
      </h2>

      {/* Avisos --------------------------------------------------- */}
      {info && (
        <p className="mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded">
          {info}
        </p>
      )}
      {errorMessage && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="cedula"
            className="block text-sm font-medium text-slate-700"
          >
            Cédula (contraseña)
          </label>
          <input
            id="cedula"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-md shadow text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {isLoading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
          )}
          Iniciar sesión
        </button>
      </form>
    </div>
  );
};

export default PatientLogin;
