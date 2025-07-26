/*  App.tsx  ────────── */
/* 1️⃣  Trae todo React como namespace */
import * as React from 'react';

/* 2️⃣  Extrae los hooks desde ese mismo objeto */
const {
  useState,
  useEffect,
  useCallback,
  useMemo,
  /* …cualquier otro hook que uses… */
} = React;

/* 3️⃣  Resto de imports sin tocar */
import {
  View,
  Patient,
  Surgeon,
  Anesthesiologist
} from './types.ts';
import AnesthesiologistDashboard from './components/AnesthesiologistDashboard.tsx';
import PatientLogin from './components/PatientLogin.tsx';
import PatientConsentView from './components/PatientConsentView.tsx';
import LandingPage from './components/LandingPage.tsx';
import SurgeonDashboard from './components/SurgeonDashboard.tsx';
import SurgeonLogin from './components/SurgeonLogin.tsx';
import AnesthesiologistLogin from './components/AnesthesiologistLogin.tsx';
/* ▼ NUEVOS imports Admin ▼ */
import { Admin }              from './types.ts';
import AdminLogin             from './components/AdminLogin.tsx';
import AdminDashboard         from './components/AdminDashboard.tsx';
/* ▲ NUEVOS imports Admin ▲ */

/* …y el resto del código de tu componente App… */

// --- Interfaces for Form Data ---

export interface AddPatientAndSurgicalConsentData {
    // Patient Info
    firstName: string;
    lastName: string;
    email: string;
    cedula: string;
    dateOfBirth: string;
    sex: 'Masculino' | 'Femenino' | 'Otro';
    // Surgical Consent Info
    consentFormId: string;
    surgicalProcedure: string;
    surgeryDateTime: string | null;
}

export interface AddAnesthesiaConsentData {
    consentFormId: string;
    instructions: string;
    fastingInstructions: {
        isInfant: boolean;
        solids?: string;
        clearLiquids?: string;
        cowMilk?: string;
        breastMilk?: string;
    };
    medicationToSuspend: string[];
}


const App: React.FC = () => {
  const [configLoaded, setConfigLoaded] = useState(!!(window as any).APP_CONFIG?.API_URL);
  const [view, setView] = useState<View>(View.Landing);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentUser, setCurrentUser] = useState<Patient | null>(null);
  const [currentSurgeon, setCurrentSurgeon] = useState<Surgeon | null>(null);
  const [currentAnesthesiologist, setCurrentAnesthesiologist] = useState<Anesthesiologist | null>(null);
  const [loginMessage, setLoginMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (configLoaded) return;
    const intervalId = setInterval(() => {
      if ((window as any).APP_CONFIG?.API_URL) {
        setConfigLoaded(true);
        clearInterval(intervalId);
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, [configLoaded]);
  
  useEffect(() => {
    if (window.location.hash === '#patient') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setView(View.PatientLogin);
    }
  }, []);

  if (!configLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-600 text-lg">Cargando configuración...</p>
      </div>
    );
  }

  const API_URL = (window as any).APP_CONFIG.API_URL;
  const loggedInProfessional = currentSurgeon || currentAnesthesiologist;

  const fetchPatients = useCallback(async () => {
    if (!loggedInProfessional) return;
    try {
        setIsLoading(true);
        // The endpoint now returns all patients with computed fields
        const response = await fetch(`${API_URL}/api/patients`);
        if (!response.ok) throw new Error('Failed to fetch patients');
        const data: Patient[] = await response.json();
        setPatients(data);
    } catch (error) {
        console.error("Error fetching patients:", error);
    } finally {
        setIsLoading(false);
    }
  }, [API_URL, loggedInProfessional]);

  useEffect(() => {
      if(view === View.AnesthesiologistDashboard || view === View.SurgeonDashboard) {
        fetchPatients();
      }
  }, [view, fetchPatients]);
  

  const handleAddPatientAndSurgicalConsent = useCallback(async (data: AddPatientAndSurgicalConsentData) => {
    if(!currentSurgeon) return;
    try {
        const response = await fetch(`${API_URL}/api/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, surgeonId: currentSurgeon.id }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add patient');
        }

        const createdPatient = await response.json();
        setPatients(prevPatients => [createdPatient, ...prevPatients].sort((a, b) => new Date(b.surgeryDateTime || 0).getTime() - new Date(a.surgeryDateTime || 0).getTime()));
    } catch (error) {
        console.error("Error adding patient:", error);
        alert(`Error: ${error.message}`);
    }
  }, [API_URL, currentSurgeon]);
  
  const handleAddAnesthesiaConsent = useCallback(async (patientId: string, data: AddAnesthesiaConsentData) => {
     if(!currentAnesthesiologist) return;
     try {
         const response = await fetch(`${API_URL}/api/patients/${patientId}/anesthesia-consent`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, anesthesiologistId: currentAnesthesiologist.id }),
        });
        if (!response.ok) throw new Error('Failed to add anesthesia consent');
        
        const updatedPatient = await response.json();
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
     } catch (error) {
        console.error("Error adding anesthesia consent:", error);
        alert(`Error: ${error.message}`);
     }
  }, [API_URL, currentAnesthesiologist]);

  const handleProfessionalLogin = useCallback(async (role: 'surgeon' | 'anesthesiologist', professionalLicenseNumber: string, password: string) => {
      try {
        const response = await fetch(`${API_URL}/api/${role}s/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ professionalLicenseNumber, password }),
        });
        const data = await response.json();
        if(!response.ok) {
            setLoginError(data.message || 'Credenciales incorrectas');
            return;
        }
        setLoginError('');
        if(role === 'surgeon') {
            setCurrentSurgeon(data);
            setView(View.SurgeonDashboard);
        } else {
            setCurrentAnesthesiologist(data);
            setView(View.AnesthesiologistDashboard);
        }
      } catch (err) {
          setLoginError('Error de conexión. Intente de nuevo.');
      }
  }, [API_URL]);

  const handleProfessionalLogout = useCallback(() => {
      setCurrentSurgeon(null);
      setCurrentAnesthesiologist(null);
      setView(View.Landing);
  }, []);


  const handlePatientLogin = useCallback(async (email: string, cedula: string) => {
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, cedula }),
        });
        const data = await response.json();
        if (!response.ok) {
            setLoginMessage(data.message || 'Credenciales inválidas.');
            setCurrentUser(null);
            return;
        }
        const patient = data as Patient;
        setCurrentUser(patient);
        setView(View.PatientConsent);
        setLoginMessage(''); // Clear previous messages
    } catch (error) {
        setLoginMessage('Error de conexión. Intente de nuevo.');
        setCurrentUser(null);
    }
  }, [API_URL]);

  const handlePatientLogout = useCallback(() => {
    setCurrentUser(null);
    setView(View.PatientLogin);
  }, []);

  const handleSignConsent = useCallback(async (type: 'surgical' | 'anesthesia', patientId: string, signatureImage: string) => {
    try {
        const response = await fetch(`${API_URL}/api/patients/${patientId}/sign-${type}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signatureImage }),
        });
        if (!response.ok) throw new Error(`Failed to sign ${type} consent`);
        const updatedPatient = await response.json();
        
        // Update patient in both list and current user
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        setCurrentUser(updatedPatient);

        // If both are signed, show a success message and allow user to log out manually
        if (updatedPatient.surgicalSignatureImage && updatedPatient.anesthesiaSignatureImage) {
            // The view will show a success message. No automatic logout.
        }

    } catch (error) {
         console.error(`Error signing ${type} consent:`, error);
    }
  }, [API_URL]);


  const renderView = () => {
    switch (view) {
      case View.PatientLogin:
        return (
          <PatientLogin
            onLogin={handlePatientLogin}
            onSwitchToLanding={() => setView(View.Landing)}
            message={loginMessage}
            setMessage={setLoginMessage}
          />
        );
      case View.PatientConsent:
        if (currentUser) {
          return (
            <PatientConsentView
              patient={currentUser}
              onSign={handleSignConsent}
              onLogout={handlePatientLogout}
              apiUrl={API_URL}
            />
          );
        }
        setView(View.PatientLogin); // Fallback if no user
        return null;
        
      case View.SurgeonLogin:
        return <SurgeonLogin onLogin={(user, pass) => handleProfessionalLogin('surgeon', user, pass)} onBack={() => setView(View.Landing)} loginError={loginError} />;

      case View.SurgeonDashboard:
         if (currentSurgeon) {
            return (
              <SurgeonDashboard
                surgeon={currentSurgeon}
                patients={patients}
                onAddPatient={handleAddPatientAndSurgicalConsent}
                onLogout={handleProfessionalLogout}
                isLoading={isLoading}
                apiUrl={API_URL}
              />
            );
        }
        setView(View.Landing); // Fallback
        return null;

      case View.AnesthesiologistLogin:
          return <AnesthesiologistLogin onLogin={(user, pass) => handleProfessionalLogin('anesthesiologist', user, pass)} onBack={() => setView(View.Landing)} loginError={loginError} />;
      
      case View.AnesthesiologistDashboard:
        if (currentAnesthesiologist) {
            return (
              <AnesthesiologistDashboard
                anesthesiologist={currentAnesthesiologist}
                patients={patients}
                onAddAnesthesiaConsent={handleAddAnesthesiaConsent}
                onLogout={handleProfessionalLogout}
                isLoading={isLoading}
                apiUrl={API_URL}
              />
            );
        }
        setView(View.Landing); // Fallback
        return null;
      
      case View.Landing:
      default:
        return (
          <LandingPage
            onSwitchToAnesthesiologistLogin={() => { setLoginError(''); setView(View.AnesthesiologistLogin)}}
            onSwitchToSurgeonLogin={() => { setLoginError(''); setView(View.SurgeonLogin)}}
            onSwitchToPatientView={() => { setLoginMessage(''); setView(View.PatientLogin)}}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {renderView()}
        </main>
    </div>
  );
};

export default App;