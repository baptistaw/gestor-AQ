/*  ────────────────────────────────────────────────
    SurgeonDashboard.tsx
   ──────────────────────────────────────────────── */

import * as React from 'react';
const { useState, useCallback, useEffect, useMemo } = React;

import {
  Patient,
  Surgeon,
  ConsentData,
  HealthProvider,
  AddPatientAndSurgicalConsentData
} from '../types.ts';

import {
  UserPlusIcon, ArrowRightOnRectangleIcon, CheckCircleIcon,
  ClockIcon, QrCodeIcon, BellAlertIcon, EnvelopeIcon
} from './icons.tsx';

import Modal     from './Modal.tsx';
import { QRImg } from './QRImg.tsx';

interface Props {
  patients: Patient[];
  surgeon: Surgeon;
  apiUrl: string;
  isLoading: boolean;
  onLogout: () => void;
  onAddPatient: (data: AddPatientAndSurgicalConsentData) => void;
}

const SurgeonDashboard: React.FC<Props> = ({
  surgeon, patients, apiUrl, isLoading,
  onLogout, onAddPatient
}) => {

  /* ─── estado ─────────────────────────────────────── */
  const [providers, setProviders] = useState<HealthProvider[]>([]);
  const [consentForms, setConsentForms] = useState<ConsentData[]>([]);
  const [consentFormError, setConsentFormError] = useState('');

  const [formData, setFormData] = useState<Omit<
    AddPatientAndSurgicalConsentData,
    'surgeryDateTime'
  > & { providerId?: string }>({
    firstName:'', lastName:'', email:'', cedula:'',
    dateOfBirth:'', sex:'Masculino',
    consentFormId:'', surgicalProcedure:''
  });
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryTime, setSurgeryTime] = useState('');
  const [error, setError] = useState('');

  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState<'all'|'action-required'|'archived'>('all');

  const [sendingEmailId, setSendingEmailId] = useState<string|null>(null);
  const [emailStatus,    setEmailStatus]    = useState<Record<string,string>>({});

  const [showQrModalFor, setShowQrModalFor] = useState<Patient|null>(null);

  /* ─── cargar PDFs + prestadores ───────────────────── */
  useEffect(() => {
    /* PDFs */
    (async () => {
      try {
        setConsentFormError('');
        const r = await fetch(`${apiUrl}/api/consent-forms?type=surgical`);
        if (!r.ok) throw new Error();
        const forms: ConsentData[] = await r.json();
        setConsentForms(forms);
        if (forms.length) {
          setFormData(prev => ({ ...prev, consentFormId: forms[0].id }));
        } else {
          setConsentFormError(
            'No se encontraron formularios. El administrador debe añadir los PDF y ejecutar el `seed`.',
          );
        }
      } catch {
        setConsentFormError(
          'No se pudieron cargar los formularios. Verifique la conexión con el servidor.',
        );
      }
    })();

    /* Prestadores */
    (async () => {
      try {
        const r = await fetch(`${apiUrl}/api/providers`);
        if (r.ok) setProviders(await r.json());
      } catch {/* silencio */}
    })();
  }, [apiUrl]);

  /* ─── helpers ─────────────────────────────────────── */
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = useCallback(() => {
    setFormData({
      firstName:'', lastName:'', email:'', cedula:'',
      dateOfBirth:'', sex:'Masculino',
      consentFormId: consentForms[0]?.id ?? '',
      surgicalProcedure:''
    });
    setSurgeryDate(''); setSurgeryTime('');
  }, [consentForms]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { firstName,lastName,email,cedula,dateOfBirth,
            consentFormId,surgicalProcedure,providerId } = formData;
    if (!firstName||!lastName||!email||!cedula||!dateOfBirth||
        !consentFormId||!surgicalProcedure||!providerId) {
      return setError('Todos los campos son obligatorios.');
    }
    setError('');
    const surgeryDateTime =
      surgeryDate && surgeryTime
        ? new Date(`${surgeryDate}T${surgeryTime}`).toISOString()
        : null;

    onAddPatient({ ...formData, surgeryDateTime });
    resetForm();
  }, [formData, surgeryDate, surgeryTime, onAddPatient, resetForm]);

  const handleSendEmail = useCallback(async (patientId:string, email:string) => {
    if (!confirm(`¿Enviar consentimientos a ${email}?`)) return;
    setSendingEmailId(patientId); setEmailStatus(p=>({ ...p, [patientId]:'' }));
    try {
      const r = await fetch(`${apiUrl}/api/patients/${patientId}/send-consent-email`,{method:'POST'});
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setEmailStatus(p=>({ ...p, [patientId]:'✓ Enviado' }));
    } catch (e:any) {
      setEmailStatus(p=>({ ...p, [patientId]:`Error: ${e.message}` }));
    } finally {
      setSendingEmailId(null);
      setTimeout(()=>setEmailStatus(p=>({ ...p, [patientId]:'' })),5000);
    }
  }, [apiUrl]);

  const buildPortalUrl = (p:Patient)=>
    `${window.location.origin}/#patient?email=${encodeURIComponent(p.email)}`;

  const filteredPatients = useMemo(()=>patients
    .filter(p=>{
      if (filterStatus==='all')            return !p.isArchived;
      if (filterStatus==='action-required')return p.isActionRequired;
      if (filterStatus==='archived')       return p.isArchived;
      return true;
    })
    .filter(p=>{
      const t=searchTerm.toLowerCase();
      return !t || `${p.firstName} ${p.lastName}`.toLowerCase().includes(t) || p.cedula.toLowerCase().includes(t);
    })
  ,[patients,searchTerm,filterStatus]);

  /* ─── JSX (dejar al final) ────────────────────────── */
  return (
    <>
      {/* … <todo el bloque que ya pegaste arriba> … */}
    </>
  );
};

export default SurgeonDashboard;
