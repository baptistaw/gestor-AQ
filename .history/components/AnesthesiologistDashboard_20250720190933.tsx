/* src/components/AnesthesiologistDashboard.tsx
   ──────────────────────────────────────────── */

/* 1️⃣  Importa todo React */
import * as React from 'react';

/* 2️⃣  Extrae los hooks desde React */
const { useState, useCallback, useEffect, useMemo } = React;

/* 3️⃣  Mantén el resto de imports tal cual */
import { Patient, Anesthesiologist, ConsentData } from '../types.ts';
import { AddAnesthesiaConsentData } from '../App.tsx';
import {
  ArrowRightOnRectangleIcon, CheckCircleIcon, ClockIcon,
  DocumentPlusIcon, UserIcon, BellAlertIcon, SparklesIcon, EnvelopeIcon
} from './icons.tsx';
import { QRImg }   from "./QRImg";      // 👈 Nuevo helper (lo creamos abajo)
import Modal from './Modal.tsx';


interface AnesthesiologistDashboardProps {
  patients: Patient[];
  anesthesiologist: Anesthesiologist;
  onAddAnesthesiaConsent: (patientId: string, data: AddAnesthesiaConsentData) => void;
  onLogout: () => void;
  isLoading: boolean;
  apiUrl: string;
}

const fastingOptions = {
    solids: ['6 horas', '8 horas'],
    clearLiquids: ['2 horas', '4 horas', '6 horas'],
    cowMilk: ['6 horas', '8 horas'],
    breastMilk: ['4 horas', '6 horas'],
};

const AddAnesthesiaConsentForm: React.FC<{
    patient: Patient;
    apiUrl: string;
    onSave: (data: AddAnesthesiaConsentData) => void;
    onCancel: () => void;
}> = ({ patient, apiUrl, onSave, onCancel }) => {
  const [consentFormId, setConsentFormId] = useState('');
  const [consentForms, setConsentForms] = useState<ConsentData[]>([]);
  const [instructions, setInstructions] = useState('');
  const [isInfant, setIsInfant] = useState(false);
  const [fasting, setFasting] = useState<{solids: string, clearLiquids: string, cowMilk: string, breastMilk: string}>({
      solids: '', clearLiquids: '', cowMilk: '', breastMilk: ''
  });
  const [medicationToSuspend, setMedicationToSuspend] = useState<string[]>([]);
  const [patientMedications, setPatientMedications] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

   useEffect(() => {
    const fetchConsentForms = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/consent-forms?type=anesthesia`);
            if (!response.ok) throw new Error('Failed to fetch consent forms');
            const data: ConsentData[] = await response.json();
            setConsentForms(data);
            if (data.length > 0) {
              setConsentFormId(data[0].id);
            } else {
              setError('No hay formularios de anestesia en el servidor. El administrador debe añadirlos y ejecutar el `seed`.');
            }
        } catch (err) {
            setError('No se pudieron cargar los formularios de consentimiento.');
        }
    };
    fetchConsentForms();
  }, [apiUrl]);

  const handleGenerateInstructions = async () => {
    if (!patientMedications) {
        setError("Por favor, ingrese la medicación del paciente.");
        return;
    }
    setIsGenerating(true);
    setError('');
    try {
        const response = await fetch(`${apiUrl}/api/ai/generate-medication-instructions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                medications: patientMedications,
                surgicalProcedure: patient.surgicalProcedure 
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to generate instructions');
        }
        const { instructionsText, medicationsToSuspend } = await response.json();
        
        setInstructions(prev => prev ? `${prev}\n\n${instructionsText}` : instructionsText);
        setMedicationToSuspend(medicationsToSuspend);

    } catch (err) {
        setError(`Error al generar con IA: ${err.message}`);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentFormId) {
        setError('El formulario de consentimiento es obligatorio.');
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
        medicationToSuspend
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full">
        <h2 className="text-xl font-bold mb-2">Añadir Consentimiento de Anestesia para {patient.firstName} {patient.lastName}</h2>
        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>}

        <div>
            <label htmlFor="consent-form-id" className="block text-sm font-medium text-slate-700">Formulario de Consentimiento</label>
            <select id="consent-form-id" value={consentFormId} onChange={e => setConsentFormId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" required disabled={consentForms.length === 0}>
                {consentForms.map(form => <option key={form.id} value={form.id}>{form.fileName}</option>)}
            </select>
        </div>
        
         <fieldset>
            <legend className="block text-sm font-medium text-slate-700">Indicaciones de Ayuno</legend>
            <div className="mt-2 space-y-3">
                 <div className="relative flex items-start">
                    <div className="flex h-6 items-center"><input id="isInfant" type="checkbox" checked={isInfant} onChange={(e) => setIsInfant(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" /></div>
                    <div className="ml-3 text-sm"><label htmlFor="isInfant" className="font-medium text-slate-700">¿Es un lactante?</label></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="solids" className="block text-xs font-medium text-slate-600">Sólidos</label>
                        <select id="solids" name="solids" value={fasting.solids} onChange={e => setFasting(prev => ({...prev, solids: e.target.value}))} className="mt-1 block w-full py-2 pl-3 pr-10 text-base border-slate-300 sm:text-sm rounded-md">
                            <option value="">Seleccionar</option>{fastingOptions.solids.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="clearLiquids" className="block text-xs font-medium text-slate-600">Líquidos Claros</label>
                        <select id="clearLiquids" name="clearLiquids" value={fasting.clearLiquids} onChange={e => setFasting(prev => ({...prev, clearLiquids: e.target.value}))} className="mt-1 block w-full py-2 pl-3 pr-10 text-base border-slate-300 sm:text-sm rounded-md">
                             <option value="">Seleccionar</option>{fastingOptions.clearLiquids.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
                {isInfant && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="cowMilk" className="block text-xs font-medium text-slate-600">Leche de Vaca</label>
                            <select id="cowMilk" name="cowMilk" value={fasting.cowMilk} onChange={e => setFasting(prev => ({...prev, cowMilk: e.target.value}))} className="mt-1 block w-full py-2 pl-3 pr-10 text-base border-slate-300 sm:text-sm rounded-md">
                                <option value="">Seleccionar</option>{fastingOptions.cowMilk.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="breastMilk" className="block text-xs font-medium text-slate-600">Leche Materna</label>
                            <select id="breastMilk" name="breastMilk" value={fasting.breastMilk} onChange={e => setFasting(prev => ({...prev, breastMilk: e.target.value}))} className="mt-1 block w-full py-2 pl-3 pr-10 text-base border-slate-300 sm:text-sm rounded-md">
                                <option value="">Seleccionar</option>{fastingOptions.breastMilk.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                     </div>
                )}
            </div>
        </fieldset>

        <fieldset>
            <legend className="text-sm font-medium text-slate-700">Instrucciones de Medicación (Asistente IA)</legend>
            <div className="mt-2 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                <div>
                    <label htmlFor="patientMedications" className="block text-xs font-medium text-slate-600">Medicación actual del paciente</label>
                    <textarea id="patientMedications" value={patientMedications} onChange={e => setPatientMedications(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="Ej: Aspirina 100mg/día, Metformina 850mg c/12h, Losartan 50mg..."></textarea>
                </div>
                <button type="button" onClick={handleGenerateInstructions} disabled={isGenerating || !patientMedications} className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-400">
                    {isGenerating ? (
                        <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Generando...
                        </>
                    ) : (
                        <>
                        <SparklesIcon className="h-5 w-5"/> Generar Instrucciones con IA
                        </>
                    )}
                </button>
            </div>
        </fieldset>
        
        <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-slate-700">Instrucciones Especiales y Generadas</label>
            <textarea id="instructions" value={instructions} onChange={e => setInstructions(e.target.value)} rows={5} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="Las instrucciones de la IA aparecerán aquí. Puede añadir o editar lo que necesite."></textarea>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-slate-100 hover:bg-slate-200">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed" disabled={consentForms.length === 0}>Guardar y Enviar</button>
        </div>
    </form>
  )
}


const AnesthesiologistDashboard: React.FC<AnesthesiologistDashboardProps> = ({ anesthesiologist, patients, onAddAnesthesiaConsent, onLogout, isLoading, apiUrl }) => {
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'action-required' | 'archived'>('all');
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ [key: string]: string }>({});

  const handleSaveConsent = (data: AddAnesthesiaConsentData) => {
    if (modalPatient) {
        onAddAnesthesiaConsent(modalPatient.id, data);
        setModalPatient(null);
    }
  };
  
  const handleSendEmail = useCallback(async (patientId: string, patientEmail: string) => {
    if (!confirm(`¿Confirmas que deseas enviar los consentimientos al correo ${patientEmail}?`)) {
        return;
    }

    setSendingEmailId(patientId);
    setEmailStatus(prev => ({...prev, [patientId]: ''}));
    try {
        const response = await fetch(`${apiUrl}/api/patients/${patientId}/send-consent-email`, {
            method: 'POST',
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.message || 'Error desconocido');
        
        setEmailStatus(prev => ({ ...prev, [patientId]: '✓ Enviado' }));
    } catch(err: any) {
        setEmailStatus(prev => ({...prev, [patientId]: `Error: ${err.message}`.substring(0, 30) }));
    } finally {
        setSendingEmailId(null);
        setTimeout(() => {
            setEmailStatus(prev => ({...prev, [patientId]: ''}));
        }, 5000);
    }
  }, [apiUrl]);

  const filteredPatients = useMemo(() => {
    return patients
      .filter(p => {
        if (filterStatus === 'all') return !p.isArchived;
        if (filterStatus === 'action-required') return p.isActionRequired;
        if (filterStatus === 'archived') return p.isArchived;
        return true;
      })
      .filter(p => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchLower);
        const cedulaMatch = p.cedula.toLowerCase().includes(searchLower);
        return searchTerm === '' || nameMatch || cedulaMatch;
      });
  }, [patients, searchTerm, filterStatus]);

  return (
    <>
    <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Panel del Anestesiólogo</h1>
                <p className="mt-1 text-slate-600">Bienvenido, Dr(a). {anesthesiologist.firstName} {anesthesiologist.lastName} (Mat. {anesthesiologist.professionalLicenseNumber})</p>
            </div>
            <button onClick={onLogout} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                Cerrar Sesión <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
        </header>

        <main className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">Lista de Pacientes</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4 pb-4 border-b border-slate-200">
                <div className="flex-grow">
                    <label htmlFor="search" className="sr-only">Buscar</label>
                    <input
                        id="search"
                        type="text"
                        placeholder="Buscar por nombre o cédula..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm"
                    />
                </div>
                <div className="flex-shrink-0">
                     <label htmlFor="filter" className="sr-only">Filtrar</label>
                     <select 
                        id="filter"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as any)}
                        className="block w-full h-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm sm:text-sm"
                     >
                        <option value="all">Activos</option>
                        <option value="action-required">Acción Requerida</option>
                        <option value="archived">Archivados</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <p className="text-slate-500 text-center py-8">Cargando pacientes...</p>
            ) : filteredPatients.length === 0 ? (
                 <p className="text-slate-500 text-center py-8">No se encontraron pacientes con los filtros actuales.</p>
            ) : (
                <div className="space-y-3">
                    {filteredPatients.map(patient => (
                        <div key={patient.id} className={`p-4 border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start gap-4 transition-opacity ${patient.isArchived ? 'opacity-60' : ''}`}>
                            <div className="flex-1 flex gap-4 items-start">
                                {patient.isActionRequired && (
                                    <div className="flex-shrink-0 pt-1" title="Acción requerida: consentimientos pendientes y cirugía próxima.">
                                        <BellAlertIcon className="h-6 w-6 text-amber-500" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-bold text-lg">{patient.lastName}, {patient.firstName} <span className="text-base font-normal text-slate-500">({patient.age} años)</span></p>
                                    <p className="text-sm text-slate-600 font-medium">Procedimiento: {patient.surgicalProcedure || 'No especificado'}</p>
                                    <p className="text-sm text-slate-600">Cirujano(a): Dr(a). {patient.surgeon?.firstName} {patient.surgeon?.lastName}</p>
                                    <div className="mt-2 flex gap-2 text-xs">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${patient.surgicalSignatureImage ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`} title="Consentimiento Quirúrgico">
                                           {patient.surgicalSignatureImage ? <CheckCircleIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />} Quirúrgico
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${!patient.anesthesiaConsent ? 'bg-slate-100 text-slate-600' : patient.anesthesiaSignatureImage ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`} title="Consentimiento de Anestesia">
                                            {patient.anesthesiaSignatureImage ? <CheckCircleIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />} Anestesia
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 self-end sm:self-center flex items-center gap-2">
                                <button
                                    onClick={() => handleSendEmail(patient.id, patient.email)}
                                    disabled={sendingEmailId === patient.id || patient.isArchived}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 border-transparent text-sm font-medium rounded-full shadow-sm text-white transition-colors
                                        ${emailStatus[patient.id]?.includes('Error') ? 'bg-red-500' : 'bg-slate-600 hover:bg-slate-700'} disabled:bg-slate-400 disabled:cursor-not-allowed`}
                                    title="Enviar consentimientos por correo"
                                >
                                    {sendingEmailId === patient.id ? (
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <EnvelopeIcon className="h-4 w-4" />
                                    )}
                                    {emailStatus[patient.id] ? <span className="text-xs">{emailStatus[patient.id]}</span> : <span className="hidden sm:inline">Email</span>}
                                </button>
                                {patient.anesthesiaConsent ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        <CheckCircleIcon className="h-5 w-5 mr-1.5"/> Consentimiento Enviado
                                     </span>
                                ) : (
                                    <button onClick={() => setModalPatient(patient)} className="inline-flex items-center gap-1.5 px-3 py-1 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400" disabled={patient.isArchived}>
                                      <DocumentPlusIcon className="h-4 w-4"/> Añadir Consent. Anestesia
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    </div>
    {modalPatient && (
        <Modal onClose={() => setModalPatient(null)}>
            <AddAnesthesiaConsentForm 
                patient={modalPatient}
                apiUrl={apiUrl}
                onSave={handleSaveConsent}
                onCancel={() => setModalPatient(null)}
            />
        </Modal>
    )}
    </>
  );
};

export default AnesthesiologistDashboard;