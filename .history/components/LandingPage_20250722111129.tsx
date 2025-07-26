import React from 'react';
import { BriefcaseIcon, UserIcon, ShieldCheckIcon, InformationCircleIcon } from './icons.tsx';

interface LandingPageProps {
  /** Props que recibe LandingPage */
  interface LandingPageProps {
  onSwitchToAdminLogin:            () => void;   // 🆕
  onSwitchToSurgeonLogin:          () => void;
  onSwitchToAnesthesiologistLogin: () => void;
  onSwitchToPatientView:           () => void;   // 🆕 faltaba
}
const LandingPage: React.FC<LandingPageProps> = ({
  onSwitchToAdminLogin,                       // 🟢 faltaba desestructurarlo
  onSwitchToSurgeonLogin,
  onSwitchToAnesthesiologistLogin,
  onSwitchToPatientView,
}) => {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen -my-8 px-4">
      <div className="w-full max-w-4xl text-center">
        
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">
          Gestor de Consentimiento Digital
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Una solución moderna, segura y eficiente para la gestión de consentimientos informados preoperatorios.
        </p>

        <div className="mt-10 mx-auto max-w-lg">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Bienvenido</h2>
              <p className="text-slate-600 mb-6">Por favor, seleccione su rol para continuar.</p>
              <div className="space-y-4">
                  <button
                      onClick={onSwitchToSurgeonLogin}
                      className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
                  >
                      <BriefcaseIcon className="h-6 w-6"/>
                      Soy Cirujano(a)
                  </button>
                  <button
                      onClick={onSwitchToAnesthesiologistLogin}
                      className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                      <BriefcaseIcon className="h-6 w-6"/>
                      Soy Anestesiólogo(a)
                  </button>
                  <button
                      onClick={onSwitchToPatientView}
                      className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                  >
                      <UserIcon className="h-6 w-6"/>
                      Soy Paciente
                  </button>
{/* acceso para administrador */}
                  <button
                    onClick={onSwitchToAdminLogin}
                    className="w-full inline-flex items-center justify-center gap-3 px-5 py-3
                               border border-transparent text-base font-medium rounded-md
                               text-white bg-rose-600 hover:bg-rose-700"
                  >
                      <ShieldCheckIcon className="h-6 w-6"/>
                      Acceso&nbsp;Administrador
                  </button>  
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-slate-100 p-6 rounded-xl">
                <h3 className="font-bold text-lg flex items-center gap-2"><InformationCircleIcon className="h-6 w-6 text-indigo-500"/>¿Cómo Funciona?</h3>
                <ul className="mt-3 space-y-2 text-slate-600 list-inside">
                    <li className="flex items-start gap-2"><span className="font-bold text-indigo-500">1.</span> <div><span className="font-semibold">Creación:</span> El cirujano crea el perfil del paciente y asigna el consentimiento quirúrgico.</div></li>
                    <li className="flex items-start gap-2"><span className="font-bold text-indigo-500">2.</span> <div><span className="font-semibold">Complemento:</span> El anestesiólogo añade el consentimiento de anestesia y las indicaciones.</div></li>
                    <li className="flex items-start gap-2"><span className="font-bold text-indigo-500">3.</span> <div><span className="font-semibold">Acceso y Firma:</span> El paciente accede a su portal y firma ambos documentos digitalmente.</div></li>
                    <li className="flex items-start gap-2"><span className="font-bold text-indigo-500">4.</span> <div><span className="font-semibold">Gestión:</span> Los especialistas ven el estado de todos los consentimientos en tiempo real.</div></li>
                </ul>
            </div>
             <div className="bg-slate-100 p-6 rounded-xl">
                <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheckIcon className="h-6 w-6 text-emerald-500"/>Descargo de Responsabilidad</h3>
                <p className="mt-3 text-slate-600 text-sm">
                    Esta aplicación es una herramienta de facilitación para la gestión de consentimientos y no reemplaza la consulta médica ni el juicio clínico profesional. La seguridad y confidencialidad de los datos son una prioridad.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;