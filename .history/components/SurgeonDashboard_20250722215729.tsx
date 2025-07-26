/* ────────────────────────────────────────────────────────────
   SurgeonDashboard.tsx
──────────────────────────────────────────────────────────── */

import * as React from 'react';
const { useState, useCallback, useEffect, useMemo } = React;


import {
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ClockIcon,
  QrCodeIcon,
  BellAlertIcon,
  EnvelopeIcon,
} from './icons.tsx';

import { QRImg } from './QRImg.tsx';
import Modal   from './Modal.tsx';



interface Props {
  patients: Patient[];
  surgeon: Surgeon;
  onAddPatient: (data: AddPatientAndSurgicalConsentData) => void;
  onLogout: () => void;
  isLoading: boolean;
  apiUrl: string;
}

const SurgeonDashboard: React.FC<Props> = ({
  surgeon,
  patients,
  onAddPatient,
  onLogout,
  isLoading,
  apiUrl,
}) => {
  /* ─────────────── State ─────────────── */
  const [formData, setFormData] = useState<
    Omit<AddPatientAndSurgicalConsentData,
      'surgeryDateTime'> & { surgeryDateTime?: string | null }
  >({
    firstName: '',
    lastName: '',
    email: '',
    cedula: '',
    dateOfBirth: '',
    sex: 'Masculino',
    consentFormId: '',
    surgicalProcedure: '',
    providerId: '',
    surgeryDateTime: null,
  });

  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryTime, setSurgeryTime] = useState('');
  const [consentForms,   setConsentForms]   = useState<ConsentData[]>([]);
  const [consentFormErr, setConsentFormErr] = useState('');
  const [providers, setProviders] = useState<HealthProvider[]>([]);
  const [error, setError] = useState('');
  const [showQrModalFor, setShowQrModalFor] = useState<Patient | null>(null);

  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] =
    useState<'all' | 'action-required' | 'archived'>('all');

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailStatus,    setEmailStatus]    = useState<Record<string,string>>({});

  /* ─────────────── Data‑fetching ─────────────── */
  useEffect(() => {
    const fetchConsentForms = async () => {
      try {
        setConsentFormErr('');
        const r = await fetch(
          `${apiUrl}/api/consent-forms?type=surgical`,
        );
        if (!r.ok) throw new Error();
        const data: ConsentData[] = await r.json();
        setConsentForms(data);
        if (data.length)
          setFormData(prev => ({ ...prev, consentFormId: data[0].id }));
        else
          setConsentFormErr(
            'No se encontraron formularios. El administrador debe añadir los PDF y ejecutar el seed.',
          );
      } catch {
        setConsentFormErr(
          'No se pudieron cargar los formularios. Verifique la conexión con el servidor.',
        );
      }
    };

    const fetchProviders = async () => {
      try {
        const r = await fetch(`${apiUrl}/api/providers`);
        if (r.ok) setProviders(await r.json());
      } catch {
        /* silencio ⇒ el campo quedará vacío */
      }
    };

    fetchConsentForms();
    fetchProviders();
  }, [apiUrl]);

  /* ─────────────── Handlers ─────────────── */
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      email: '',
      cedula: '',
      dateOfBirth: '',
      sex: 'Masculino',
      surgicalProcedure: '',
      providerId: '',
      consentFormId: consentForms[0]?.id ?? '',
      surgeryDateTime: null,
    }));
    setSurgeryDate('');
    setSurgeryTime('');
  };

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
        providerId,
      } = formData;

      if (
        !firstName ||
        !lastName ||
        !email ||
        !cedula ||
        !dateOfBirth ||
        !consentFormId ||
        !surgicalProcedure ||
        !providerId
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
    [formData, surgeryDate, surgeryTime, onAddPatient],
  );

  const handleSendEmail = async (patientId: string, patientEmail: string) => {
    if (
      !confirm(
        `¿Confirmas que deseas enviar los consentimientos al correo ${patientEmail}?`,
      )
    )
      return;

    setSendingEmailId(patientId);
    setEmailStatus(prev => ({ ...prev, [patientId]: '' }));
    try {
      const r = await fetch(
        `${apiUrl}/api/patients/${patientId}/send-consent-email`,
        { method: 'POST' },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Error desconocido');
      setEmailStatus(prev => ({ ...prev, [patientId]: '✓ Enviado' }));
    } catch (e: any) {
      setEmailStatus(prev => ({
        ...prev,
        [patientId]: `Error: ${e.message}`.slice(0, 30),
      }));
    } finally {
      setSendingEmailId(null);
      setTimeout(
        () => setEmailStatus(prev => ({ ...prev, [patientId]: '' })),
        5000,
      );
    }
  };

  const buildPortalUrl = (p: Patient) =>
    `${window.location.origin}/#patient?email=${encodeURIComponent(p.email)}`;

  /* ─────────────── Derivados ─────────────── */
  const filteredPatients = useMemo(() => {
    return patients
      .filter(p => {
        if (filterStatus === 'all') return !p.isArchived;
        if (filterStatus === 'action-required') return p.isActionRequired;
        if (filterStatus === 'archived') return p.isArchived;
        return true;
      })
      .filter(p => {
        const s = searchTerm.toLowerCase();
        return (
          s === '' ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(s) ||
          p.cedula.toLowerCase().includes(s)
        );
      });
  }, [patients, searchTerm, filterStatus]);

  /* ─────────────── Render ─────────────── */
  return (
    <>
      {/* ——— cabecera + formulario + listado ——— */}
      {/* (Bloque JSX idéntico al que ya copiaste; omitido por brevedad) */}
    </>
  );
};

export default SurgeonDashboard;
