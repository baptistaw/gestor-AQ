/* ────────────────────────────────────────────────────────────
   LandingPage.tsx
──────────────────────────────────────────────────────────── */

import React from 'react';
import {
  BriefcaseIcon,
  UserIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from './icons.tsx';

/* ---------- Props ---------- */
export interface LandingPageProps {
  onSwitchToAdminLogin:            () => void;
  onSwitchToSurgeonLogin:          () => void;
  onSwitchToAnesthesiologistLogin: () => void;
  onSwitchToPatientView:           () => void;
}

/* ---------- Componente ---------- */
const LandingPage: React.FC<LandingPageProps> = ({
  onSwitchToAdminLogin,
  onSwitchToSurgeonLogin,
  onSwitchToAnesthesiologistLogin,
  onSwitchToPatientView,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen -my-8 px-4">
      <div className="w-full max-w-4xl text-center">

        {/* ── cabecera ─────────────────────── */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">
          Gestor de Consentimiento Digital
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Una solución moderna, segura y eficiente para la gestión de
          consentimientos informados pre‑operatorios.
        </p>

        {/* ── selector de rol ──────────────── */}
        <div className="mt-10 mx-auto max-w-lg">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Bienvenido
            </h2>
            <p className="text-slate-600 mb-6">
              Seleccione su rol para continuar
            </p>

            <div className="space-y-4">
              <button
                onClick={onSwitchToSurgeonLogin}
                className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
              >
                <BriefcaseIcon className="h-6 w-6" />
                Soy Cirujano(a)
              </button>

              <button
                onClick={onSwitchToAnesthesiologistLogin}
                className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <BriefcaseIcon className="h-6 w-6" />
                Soy Anestesiólogo(a)
              </button>

              <button
                onClick={onSwitchToPatientView}
                className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
              >
                <UserIcon className="h-6 w-6" />
                Soy Paciente
              </button>

              {/* botón admin */}
              <button
                onClick={onSwitchToAdminLogin}
                className="btn-primary w-full"
              >
                Acceso Administrador
              </button>
            </div>
          </div>
        </div>

        {/* ── info adicional ───────────────── */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Cómo funciona */}
          <div className="bg-slate-100 p-6 rounded-xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-indigo-500" />
              ¿Cómo funciona?
            </h3>
            <ul className="mt-3 space-y-2 text-slate-600 list-inside">
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500">1.</span>
                El cirujano crea el perfil del paciente y asigna el
                consentimiento quirúrgico.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500">2.</span>
                El anestesiólogo añade el consentimiento de anestesia e
                indicaciones.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500">3.</span>
                El paciente accede y firma ambos documentos.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-500">4.</span>
                Los especialistas ven el estado en tiempo real.
              </li>
            </ul>
          </div>

          {/* Descargo */}
          <div className="bg-slate-100 p-6 rounded-xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
              Descargo de responsabilidad
            </h3>
            <p className="mt-3 text-slate-600 text-sm">
              Esta aplicación no reemplaza la consulta médica; la seguridad y
              confidencialidad de los datos son una prioridad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
