
import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, KeyIcon, EnvelopeIcon } from './icons';

interface PatientLoginProps {
  onLogin: (email: string, cedula: string) => void;
  onSwitchToLanding: () => void;
  message: string;
  setMessage: (message: string) => void;
}

const PatientLogin: React.FC<PatientLoginProps> = ({ onLogin, onSwitchToLanding, message, setMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Password is the cedula

  useEffect(() => {
    // Clear message on component mount if it's not a success message
    if (!message.includes('éxito')) {
        setMessage('');
    }
  }, [setMessage]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen -my-8">
      <div className="w-full max-w-md">
        <button onClick={onSwitchToLanding} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver a la Página Principal
        </button>
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-center text-slate-800">Portal del Paciente</h1>
            <p className="text-center text-slate-500 mt-2 mb-6">Inicie sesión para ver y firmar su formulario de consentimiento.</p>
            {message && <p className={`mb-4 text-center text-sm p-3 rounded-md ${message.includes('éxito') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                    <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                        </span>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="usted@ejemplo.com"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">Cédula de Identidad (Contraseña)</label>
                     <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <KeyIcon className="h-5 w-5 text-slate-400" />
                        </span>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Su Cédula de Identidad"
                        />
                    </div>
                </div>
                <button type="submit" className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Iniciar Sesión
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;