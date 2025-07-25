import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Patient,
  Surgeon,
  ConsentData,
} from '../types.ts';
import { AddPatientAndSurgicalConsentData } from '../App.tsx';
import {
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BellAlertIcon,
  EnvelopeIcon,
  QrCodeIcon,
} from './icons.tsx';
import Modal from './Modal.tsx';
import { ConsentQR } from './ConsentQR.tsx';      // ✅ NUEVO

interface SurgeonDashboardProps {
  patients: Patient[];
  surgeon: Surgeon;
  onAddPatient: (data: AddPatientAndSurgicalConsentData) => void;
  onLogout: () => void;
  isLoading: boolean;
  apiUrl: string;
}

const SurgeonDashboard: React.FC<SurgeonDashboardProps> = ({
  surgeon,
  patients,
  onAddPatient,
  onLogout,
  isLoading,
  apiUrl,
}) => {
  /** ----------------------------- estado formulario ---------------------------- */
  const [formData, setFormData] = useState<
    Omit<
      AddPatientAndSurgicalConsentData,
      'surgeryDateTime' | 'consentFormId'
    > & { consentFormId: string }
  >({
    firstName: '',
    lastName: '',
    email: '',
    cedula: '',
    dateOfBirth: '',
    sex: 'Masculino',
    consentFormId: '',
    surgicalProcedure: '',
  });
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryTime, setSurgeryTime] = useState('');
  const [consentForms, setConsentForms] = useState<ConsentData[]>([]);
  const [error, setError] = useState('');
  const [consentFormError, setConsentFormError] = useState('');
  const [showQrModalFor, setShowQrModalFor] = useState<Patient | null>(null);

  /** ----------------------------- filtros tabla -------------------------------- */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'action-required' | 'archived'
  >('all');

  /** ----------------------------- email ---------------------------------------- */
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ [k: string]: string }>({});

  /** ----------------------------- cargar formularios PDF ----------------------- */
  useEffect(() => {
    const fetchConsentForms = async () => {
      try {
        setConsentFormError('');
        const res = await fetch(
          `${apiUrl}/api/consent-forms?type=surgical`,
        );
        if (!res.ok) throw new Error();
        const data: ConsentData[] = await res.json();
        setConsentForms(data);
        if (data.length)
          setFormData(prev => ({
            ...prev,
            consentFormId: data[0].id,
          }));
        else
          setConsentFormError(
            'No hay formularios PDF cargados. Sube los archivos y ejecuta el seed.',
          );
      } catch {
        setConsentFormError(
          'Error al obtener los formularios. Verifica el servidor.',
        );
      }
    };
    fetchConsentForms();
  }, [apiUrl]);

  /** ----------------------------- handlers formulario -------------------------- */
  const handleFormChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      cedula: '',
      dateOfBirth: '',
      sex: 'Masculino',
      consentFormId: consentForms[0]?.id ?? '',
      surgicalProcedure: '',
    });
    setSurgeryDate('');
    setSurgeryTime('');
  }, [consentForms]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const {
        firstName,
        lastName,
        email,
        cedula,
        dateOfBirth,
        consentFormId,
        surgicalProcedure,
      } = formData;

      if (
        !firstName ||
        !lastName ||
        !email ||
        !cedula ||
        !dateOfBirth ||
        !consentFormId ||
        !surgicalProcedure
      ) {
        setError('Todos los campos son obligatorios.');
        return;
      }
      setError('');

      const surgeryDateTime =
        surgeryDate && surgeryTime
          ? new Date(`${surgeryDate}T${surgeryTime}`).toISOString()
          : null;

      onAddPatient({ ...formData, surgeryDateTime });
      resetForm();
    },
    [formData, surgeryDate, surgeryTime, onAddPatient, resetForm],
  );

  /** ----------------------------- email ---------------------------------------- */
  const handleSendEmail = useCallback(
    async (patientId: string, patientEmail: string) => {
      if (
        !confirm(
          `¿Enviar los consentimientos a ${patientEmail}?`,
        )
      )
        return;

      setSendingEmailId(patientId);
      setEmailStatus(prev => ({ ...prev, [patientId]: '' }));
      try {
        const res = await fetch(
          `${apiUrl}/api/patients/${patientId}/send-consent-email`,
          { method: 'POST' },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEmailStatus(prev => ({
          ...prev,
          [patientId]: '✓ Enviado',
        }));
      } catch (err: any) {
        setEmailStatus(prev => ({
          ...prev,
          [patientId]: `Error: ${err.message}`.slice(0, 28),
        }));
      } finally {
        setSendingEmailId(null);
        setTimeout(
          () =>
            setEmailStatus(prev => ({
              ...prev,
              [patientId]: '',
            })),
          5_000,
        );
      }
    },
    [apiUrl],
  );

  /** ----------------------------- filtro tabla --------------------------------- */
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return patients
      .filter(p => {
        if (filterStatus === 'all') return !p.isArchived;
        if (filterStatus === 'action-required')
          return p.isActionRequired;
        if (filterStatus === 'archived') return p.isArchived;
        return true;
      })
      .filter(p => {
        const name = `${p.firstName} ${p.lastName}`.toLowerCase();
        const ced = p.cedula.toLowerCase();
        return !term || name.includes(term) || ced.includes(term);
      });
  }, [patients, searchTerm, filterStatus]);

  /** ----------------------------- URL portal paciente -------------------------- */
  const patientPortalBase = `${window.location.origin}#patient`;

  /** --------------------------------------------------------------------------- */
  return (
    <>
      {/* ------------- cabecera ------------- */}
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Panel del Cirujano
            </h1>
            <p className="mt-1 text-slate-600">
              Bienvenido, Dr(a). {surgeon.firstName}{' '}
              {surgeon.lastName} ({surgeon.specialty})
            </p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
          >
            Cerrar Sesión{' '}
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ------------------ formulario ------------------ */}
          {/* … formulario sin cambios (omitido en esta respuesta por longitud) … */}

          {/* ------------------ listado pacientes ------------------ */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4">
                Estado de Consentimientos
              </h2>

              {/* filtros */}
              {/* … filtros sin cambios … */}

              {isLoading ? (
                <p>Cargando pacientes…</p>
              ) : filteredPatients.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No se encontraron pacientes.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredPatients.map(p => {
                    const surgicalPdfUrl = p.surgicalConsentId
                      ? `${apiUrl}/api/consent-forms/${p.surgicalConsentId}/pdf`
                      : null;

                    return (
                      <div
                        key={p.id}
                        className={`p-4 border rounded-lg bg-slate-50/50 transition-opacity ${
                          p.isArchived ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                          {/* — info paciente — */}
                          {/* … resto de info … */}

                          {/* — acciones — */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* QR inline */}
                            <ConsentQR value={surgicalPdfUrl} size={80} />

                            {/* botón modal QR (acceso portal paciente) */}
                            <button
                              onClick={() => setShowQrModalFor(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-white bg-slate-600 hover:bg-slate-700"
                            >
                              <QrCodeIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                Portal
                              </span>
                            </button>

                            {/* botón email */}
                            {/* … botón email sin cambios … */}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -------- modal QR portal paciente -------- */}
      {showQrModalFor && (
        <Modal onClose={() => setShowQrModalFor(null)}>
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm mx-auto">
            <h3 className="text-xl font-bold text-slate-800">
              Acceso para {showQrModalFor.firstName}
            </h3>
            <p className="text-slate-600 mt-2 mb-4">
              Escanee este código QR con el móvil del
              paciente para abrir su portal.
            </p>
            <ConsentQR
              value={`${patientPortalBase}?id=${showQrModalFor.id}`}
              size={256}
            />
            <button
              onClick={() => setShowQrModalFor(null)}
              className="mt-6 w-full px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SurgeonDashboard;
