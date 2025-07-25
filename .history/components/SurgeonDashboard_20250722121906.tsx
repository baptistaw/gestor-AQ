/* src/components/SurgeonDashboard.tsx
   ─────────────────────────────────── */

/* 1️⃣‑ Importa React como un todo */
import * as React from 'react';

/* 2️⃣‑ Desestructura los hooks que vas a usar */
const { useState, useCallback, useEffect, useMemo } = React;

/* 3️⃣‑ El resto de imports se mantienen */
import { Patient, Surgeon, ConsentData } from '../types.ts';
import AddPatientModal from './AddPatientModal.tsx';
+import { HealthProvider } from '../types.ts';
import {
  UserPlusIcon, ArrowRightOnRectangleIcon, CheckCircleIcon,
  ClockIcon, BriefcaseIcon, QrCodeIcon, BellAlertIcon, EnvelopeIcon
} from './icons.tsx';
import { QRImg }   from "./QRImg.tsx";
import Modal from './Modal.tsx';

interface SurgeonDashboardProps {
  patients: Patient[];
  surgeon: Surgeon;
  onAddPatient: (data: AddPatientAndSurgicalConsentData) => void;
  onLogout: () => void;
  isLoading: boolean;
  apiUrl: string;
}

const SurgeonDashboard: React.FC<SurgeonDashboardProps> = ({ surgeon, patients, onAddPatient, onLogout, isLoading, apiUrl }) => {
  const [formData, setFormData] = useState<Omit<AddPatientAndSurgicalConsentData, 'surgeryDateTime' | 'consentFormId'> & { consentFormId: string }>({
      firstName: '', lastName: '', email: '', cedula: '', dateOfBirth: '', 
      sex: 'Masculino', consentFormId: '', surgicalProcedure: ''
  });
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryTime, setSurgeryTime] = useState('');
  const [consentForms, setConsentForms] = useState<ConsentData[]>([]);
  const [error, setError] = useState('');
  const [consentFormError, setConsentFormError] = useState('');
  const [showQrModalFor, setShowQrModalFor] = useState<Patient | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'action-required' | 'archived'>('all');

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchConsentForms = async () => {
        try {
            setConsentFormError('');
            const response = await fetch(`${apiUrl}/api/consent-forms?type=surgical`);
            if (!response.ok) throw new Error('Failed to fetch consent forms');
            const data: ConsentData[] = await response.json();
            setConsentForms(data);
            if (data.length > 0) {
                setFormData(prev => ({...prev, consentFormId: data[0].id}));
            } else {
                setConsentFormError('No se encontraron formularios. El administrador debe añadir los PDF y ejecutar el `seed`.');
            }
        } catch (err) {
            setConsentFormError('No se pudieron cargar los formularios. Verifique la conexión con el servidor.');
        }
    };
    fetchConsentForms();
  }, [apiUrl]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  };

  const resetForm = useCallback(() => {
    setFormData({
        firstName: '', lastName: '', email: '', cedula: '', dateOfBirth: '', 
        sex: 'Masculino', consentFormId: consentForms.length > 0 ? consentForms[0].id : '', 
        surgicalProcedure: ''
    });
    setSurgeryDate('');
    setSurgeryTime('');
  }, [consentForms]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, cedula, dateOfBirth, consentFormId, surgicalProcedure } = formData;
    if (!firstName || !lastName || !email || !cedula || !dateOfBirth || !consentFormId || !surgicalProcedure) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setError('');

    const surgeryDateTime = surgeryDate && surgeryTime ? new Date(`${surgeryDate}T${surgeryTime}`).toISOString() : null;
    onAddPatient({ ...formData, surgeryDateTime });
    resetForm();
  }, [formData, onAddPatient, resetForm, surgeryDate, surgeryTime]);
  
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

 // 🔗 Construye la URL con el e‑mail para que el login lo rellene sólo
  const buildPortalUrl = (p: Patient) =>
  `${window.location.origin}/#patient?email=${encodeURIComponent(p.email)}`;


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
                <h1 className="text-3xl font-bold text-slate-800">Panel del Cirujano</h1>
                <p className="mt-1 text-slate-600">Bienvenido, Dr(a). {surgeon.firstName} {surgeon.lastName} ({surgeon.specialty})</p>
            </div>
            <button onClick={onLogout} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                Cerrar Sesión <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
        </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky lg:top-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlusIcon className="h-6 w-6 text-sky-500" />
              Crear Paciente y Consentimiento
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <fieldset className="space-y-4 border-b border-slate-200 pb-4">
                <legend className="text-md font-medium text-slate-800 -ml-1">Datos del Paciente</legend>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">Nombre</label>
                  <input type="text" id="firstName" value={formData.firstName} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border rounded-md" required/>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Apellido</label>
                  <input type="text" id="lastName" value={formData.lastName} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border rounded-md" required/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700">Fecha Nac.</label>
                        <input type="date" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border rounded-md" required/>
                    </div>
                     <div>
                        <label htmlFor="sex" className="block text-sm font-medium text-slate-700">Sexo</label>
                        <select id="sex" value={formData.sex} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border rounded-md" required>
                            <option>Masculino</option><option>Femenino</option><option>Otro</option>
                        </select>
                    </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                  <input type="email" id="email" value={formData.email} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border rounded-md" required/>
                </div>
                <div>
                  <label htmlFor="cedula" className="block text-sm font-medium text-slate-700">Cédula (Contraseña Paciente)</label>
                  <input type="text" id="cedula" value={formData.cedula} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border rounded-md" required/>
                </div>
              </fieldset>
              
              <fieldset className="space-y-4 pt-4 border-b border-slate-200 pb-4">
                 <legend className="text-md font-medium text-slate-800 -ml-1">Datos de la Cirugía</legend>
                 <div>
                    <label htmlFor="specialty" className="block text-sm font-medium text-slate-700">Especialidad Quirúrgica</label>
                    <input type="text" id="specialty" value={surgeon.specialty} className="mt-1 block w-full px-3 py-2 border rounded-md bg-slate-100" readOnly disabled/>
                  </div>
                 <div>
                    <label htmlFor="surgicalProcedure" className="block text-sm font-medium text-slate-700">Procedimiento Quirúrgico</label>
                    <input type="text" id="surgicalProcedure" value={formData.surgicalProcedure} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="Ej: Colecistectomía" required/>
                  </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Fecha y Hora (Opcional)</label>
                    <div className="flex gap-2 mt-1">
                        <input type="date" value={surgeryDate} onChange={e => setSurgeryDate(e.target.value)} className="block w-1/2 px-3 py-2 border rounded-md" />
                        <input type="time" value={surgeryTime} onChange={e => setSurgeryTime(e.target.value)} className="block w-1/2 px-3 py-2 border rounded-md" />
                    </div>
                </div>
              </fieldset>

              <fieldset className="space-y-4 pt-4">
                <legend className="text-md font-medium text-slate-800 -ml-1">Documento de Consentimiento</legend>
                 <div>
                    <label htmlFor="consentFormId" className="block text-sm font-medium text-slate-700">Formulario PDF</label>
                    <select id="consentFormId" value={formData.consentFormId} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md" disabled={consentForms.length === 0} required>
                        {consentForms.map(form => <option key={form.id} value={form.id}>{form.fileName}</option>)}
                    </select>
                    {consentFormError && <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">{consentFormError}</p>}
                 </div>
              </fieldset>
              <button type="submit" disabled={consentForms.length === 0} className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed">
                Crear y Enviar a Paciente
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4">Estado de Consentimientos</h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-4 pb-4 border-b border-slate-200">
                    <div className="flex-grow">
                        <label htmlFor="search-surg" className="sr-only">Buscar</label>
                        <input id="search-surg" type="text" placeholder="Buscar por nombre o cédula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm"/>
                    </div>
                    <div className="flex-shrink-0">
                         <label htmlFor="filter-surg" className="sr-only">Filtrar</label>
                         <select id="filter-surg" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="block w-full h-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm sm:text-sm">
                            <option value="all">Activos</option>
                            <option value="action-required">Acción Requerida</option>
                            <option value="archived">Archivados</option>
                        </select>
                    </div>
                </div>

                {isLoading ? ( <p>Cargando pacientes...</p> ) : filteredPatients.length === 0 ? ( <p className="text-slate-500 text-center py-8">No se encontraron pacientes con los filtros actuales.</p> ) : (
                    <div className="space-y-3">
                        {filteredPatients.map(patient => (
                            <div key={patient.id} className={`p-4 border border-slate-200 rounded-lg bg-slate-50/50 transition-opacity ${patient.isArchived ? 'opacity-60' : ''}`}>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                                    <div className="flex-1 flex gap-4 items-start">
                                        {patient.isActionRequired && (
                                            <div className="flex-shrink-0 pt-1" title="Acción requerida: consentimientos pendientes y cirugía próxima.">
                                                <BellAlertIcon className="h-6 w-6 text-amber-500" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-bold text-lg">{patient.lastName}, {patient.firstName} <span className="text-base font-normal text-slate-500">({patient.age} años)</span></p>
                                            <p className="text-sm text-slate-600 font-medium">{patient.surgicalProcedure}</p>
                                            <p className="text-sm text-slate-600">{patient.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                                        <div className="flex gap-2 text-xs">
                                             <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${patient.surgicalSignatureImage ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {patient.surgicalSignatureImage ? <CheckCircleIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />} Quirúrgico
                                             </span>
                                             <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${!patient.anesthesiaConsent ? 'bg-slate-100 text-slate-600' : patient.anesthesiaSignatureImage ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                 {patient.anesthesiaSignatureImage ? <CheckCircleIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />} Anestesia
                                             </span>
                                        </div>
                                        <button
                                            onClick={() => handleSendEmail(patient.id, patient.email)}
                                            disabled={sendingEmailId === patient.id || patient.isArchived}
                                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 border-transparent text-sm font-medium rounded-full shadow-sm text-white transition-colors
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
                                        <button onClick={() => setShowQrModalFor(patient)} className="inline-flex items-center gap-1.5 px-3 py-1 border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-slate-600 hover:bg-slate-700">
                                          <QrCodeIcon className="h-4 w-4"/> <span className="hidden sm:inline">QR</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
    {showQrModalFor && (
        <Modal onClose={() => setShowQrModalFor(null)}>
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm mx-auto">
                <h3 className="text-xl font-bold text-slate-800">Acceso para {showQrModalFor.firstName}</h3>
                <p className="text-slate-600 mt-2 mb-4">Escanee este código QR con el móvil del paciente para abrir su portal.</p>
                <div className="p-4 bg-white inline-block rounded-lg border">
                   <QRImg text={buildPortalUrl(showQrModalFor)} size={256} />
                </div>
                 <button onClick={() => setShowQrModalFor(null)} className="mt-6 w-full px-4 py-2 border rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    Cerrar
                 </button>
            </div>
        </Modal>
    )}
    </>
  );
};

export default SurgeonDashboard;