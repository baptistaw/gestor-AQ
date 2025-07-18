import React, { useState } from 'react';
import { ArrowLeftIcon, KeyIcon, BriefcaseIcon } from './icons';

interface AnesthesiologistLoginProps {
  onLogin: (professionalLicenseNumber: string, password: string) => void;
  onBack: () => void;
  loginError: string;
}

const AnesthesiologistLogin: React.FC<AnesthesiologistLoginProps> = ({ onLogin, onBack, loginError }) => {
  const [license, setLicense] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(license, password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen -my-8">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver
        </button>
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-center text-slate-800">Portal de Anestesiología</h1>
            <p className="text-center text-slate-500 mt-2 mb-6">Inicie sesión con sus credenciales.</p>
            {loginError && <p className="mb-4 text-center text-sm p-3 rounded-md bg-red-100 text-red-700">{loginError}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="license" className="block text-sm font-medium text-slate-700">Número de Matrícula Profesional</label>
                    <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><BriefcaseIcon className="h-5 w-5 text-slate-400" /></span>
                        <input id="license" type="text" value={license} onChange={(e) => setLicense(e.target.value)} required className="block w-full pl-10 pr-3 py-2 border rounded-md" placeholder="Su matrícula" />
                    </div>
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                     <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><KeyIcon className="h-5 w-5 text-slate-400" /></span>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full pl-10 pr-3 py-2 border rounded-md" placeholder="Contraseña" />
                    </div>
                </div>
                <button type="submit" className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    Iniciar Sesión
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AnesthesiologistLogin;
