
import React, { useState } from 'react';
import { Patient } from '../../../types.tsx';
import CameraCapture from './CameraCapture.tsx';
import Modal from './Modal.js';
import { DocumentTextIcon, PencilSquareIcon, ArrowLeftOnRectangleIcon, ChatBubbleLeftRightIcon, ArrowDownTrayIcon, ClipboardDocumentListIcon, BriefcaseIcon, CalendarDaysIcon, BellAlertIcon, UserIcon, CakeIcon, UsersIcon, CheckCircleIcon } from './icons.tsx';

interface PatientConsentViewProps {
  patient: Patient;
  onSign: (type: 'surgical' | 'anesthesia', patientId: string, signatureImage: string) => void;
  onLogout: () => void;
  apiUrl: string;
}

// --- Helper Functions for Alert Logic ---
const parseInstruction = (instruction: string): { amount: number, unit: 'horas' | 'días' } | null => {
    const match = instruction.match(/(\d+)\s+(horas?|días?)/i);
    if (!match) return null;
    return { amount: parseInt(match[1], 10), unit: match[2].toLowerCase().startsWith('hora') ? 'horas' : 'días' };
};

const calculateDeadline = (surgeryDate: Date, instruction: string): Date | null => {
    const parsed = parseInstruction(instruction);
    if (!parsed) return null;
    const deadline = new Date(surgeryDate);
    if (parsed.unit === 'horas') deadline.setHours(deadline.getHours() - parsed.amount);
    else if (parsed.unit === 'días') deadline.setDate(deadline.getDate() - parsed.amount);
    return deadline;
};

const ConsentSection: React.FC<{
  type: 'surgical' | 'anesthesia';
  patient: Patient;
  apiUrl: string;
  onSignRequest: () => void;
}> = ({ type, patient, apiUrl, onSignRequest }) => {
  const [hasConfirmedRead, setHasConfirmedRead] = useState(false);
  
  const isSurgical = type === 'surgical';
  const consent = isSurgical ? patient.surgicalConsent : patient.anesthesiaConsent;
  const signature = isSurgical ? patient.surgicalSignatureImage : patient.anesthesiaSignatureImage;
  const signedDate = isSurgical ? patient.surgicalSignedDate : patient.anesthesiaSignedDate;
  const instructions = isSurgical ? `Procedimiento: ${patient.surgicalProcedure}` : patient.anesthesiaInstructions;
  const doctor = isSurgical ? patient.surgeon : patient.anesthesiologist;
  const title = isSurgical ? "Consentimiento Quirúrgico" : "Consentimiento de Anestesia";
  
  if (!consent) return null; // Don't render if consent not added yet
  
  const consentPDFUrl = `${apiUrl}/api/consent-forms/${consent.id}/pdf`;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
          <DocumentTextIcon className="h-6 w-6"/> {title}
      </h2>
      <p className="text-sm text-slate-500 mb-2">A cargo de: Dr(a). {doctor?.firstName} {doctor?.lastName}</p>
      
      <div className="aspect-[8.5/11] border rounded-lg overflow-hidden bg-slate-50 mb-4">
         <object data={consentPDFUrl} type="application/pdf" className="w-full h-full" aria-label={`Documento de ${title}`}>
              <div className="p-4 text-center"><a href={consentPDFUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Descargar o Abrir PDF</a></div>
         </object>
      </div>

      {instructions && (
          <div className="mb-4">
              <h3 className="font-semibold text-slate-800">Instrucciones</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{instructions}</p>
          </div>
      )}
      
      {signature ? (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
            <h3 className="font-bold text-emerald-800">Firmado Correctamente</h3>
            <p className="text-sm text-emerald-700">Firmado el: {new Date(signedDate!).toLocaleString()}</p>
            <img src={signature} alt="Firma" className="mt-2 max-w-[150px] rounded border bg-white p-1" />
        </div>
      ) : (
        <div className="space-y-4">
            <div className="relative flex items-start">
                <div className="flex h-6 items-center"><input id={`cb-${type}`} type="checkbox" checked={hasConfirmedRead} onChange={(e) => setHasConfirmedRead(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600"/></div>
                <div className="ml-3 text-sm"><label htmlFor={`cb-${type}`} className="font-medium text-slate-800">Confirmo que he leído y comprendido el documento.</label></div>
            </div>
            <button onClick={onSignRequest} disabled={!hasConfirmedRead} className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 border text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
                <PencilSquareIcon className="h-5 w-5"/> Firmar Documento
            </button>
        </div>
      )}
    </div>
  );
};


const PatientConsentView: React.FC<PatientConsentViewProps> = ({ patient, onSign, onLogout, apiUrl }) => {
  const [cameraState, setCameraState] = useState<{open: boolean, type: 'surgical' | 'anesthesia' | null}>({open: false, type: null});

  const handleSignatureConfirm = (signatureImage: string) => {
    if (cameraState.type) {
        onSign(cameraState.type, patient.id, signatureImage);
    }
    setCameraState({open: false, type: null});
  };
  
  const surgeryDateTime = patient.surgeryDateTime ? new Date(patient.surgeryDateTime) : null;
  const hasFastingInstructions = patient.fastingInstructions.solids || patient.fastingInstructions.clearLiquids;
  const hasMedicationInstructions = patient.medicationToSuspend.length > 0;
  const areBothSigned = !!(patient.surgicalSignatureImage && patient.anesthesiaSignatureImage);

  return (
    <div className="space-y-6">
       <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Portal Preoperatorio</h1>
                <p className="mt-1 text-slate-600">Hola, {patient.firstName}. Revise los documentos e instrucciones a continuación.</p>
            </div>
            <button onClick={onLogout} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Cerrar Sesión
            </button>
        </header>

      {areBothSigned && (
        <div className="bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-r-lg" role="alert">
            <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6"/>
                <div >
                    <p className="font-bold">¡Proceso completado!</p>
                    <p className="text-sm">Ambos consentimientos han sido firmados con éxito.</p>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
           <ConsentSection type="surgical" patient={patient} apiUrl={apiUrl} onSignRequest={() => setCameraState({open: true, type: 'surgical'})} />
           <ConsentSection type="anesthesia" patient={patient} apiUrl={apiUrl} onSignRequest={() => setCameraState({open: true, type: 'anesthesia'})} />
        </div>

        <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700"><UserIcon className="h-6 w-6"/> Mis Datos</h2>
                <div className="space-y-3 text-slate-600">
                    <p><strong>Nombre:</strong> {patient.firstName} {patient.lastName}</p>
                    <p className="flex items-center gap-2"><strong><CakeIcon className="h-5 w-5"/> Edad:</strong> {patient.age} años ({new Date(patient.dateOfBirth).toLocaleDateString()})</p>
                    <p className="flex items-center gap-2"><strong><UsersIcon className="h-5 w-5"/> Sexo:</strong> {patient.sex}</p>
                    <p><strong>Cédula:</strong> {patient.cedula}</p>
                </div>
            </div>
          
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700"><BriefcaseIcon className="h-6 w-6"/> Información de la Cirugía</h2>
                <div className="space-y-3">
                    <div><h3 className="font-semibold text-slate-800">Procedimiento</h3><p className="text-slate-600">{patient.surgicalProcedure}</p></div>
                    <div><h3 className="font-semibold text-slate-800 flex items-center gap-1.5"><CalendarDaysIcon className="h-5 w-5"/> Fecha y Hora</h3>
                        {surgeryDateTime ? <p className="text-slate-600">{surgeryDateTime.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p> : <p className="text-slate-500">Pendiente de confirmación.</p>}
                    </div>
                </div>
            </div>
          
            {(hasFastingInstructions || hasMedicationInstructions) && patient.anesthesiaConsent && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700"><ClipboardDocumentListIcon className="h-6 w-6"/> Indicaciones Preoperatorias</h2>
                {surgeryDateTime && !patient.isArchived && (
                     <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-4">
                        <div className="flex items-center gap-2"><BellAlertIcon className="h-6 w-6 text-amber-600" /><h3 className="font-bold text-amber-800">Alertas de Preparación</h3></div>
                        <ul className="list-disc list-inside space-y-1 text-amber-700 mt-2 text-sm pl-2">
                           {patient.fastingInstructions.solids && <li><strong>Sólidos:</strong> No comer desde las <span className="font-semibold">{calculateDeadline(surgeryDateTime, patient.fastingInstructions.solids)?.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>.</li>}
                           {patient.fastingInstructions.clearLiquids && <li><strong>Líquidos Claros:</strong> No beber desde las <span className="font-semibold">{calculateDeadline(surgeryDateTime, patient.fastingInstructions.clearLiquids)?.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>.</li>}
                           {patient.medicationToSuspend.map((med, i) => (
                                <li key={i}>
                                    <strong>{med.split(' - ')[0] || med}:</strong>{' '}
                                    {(() => {
                                        const deadline = calculateDeadline(surgeryDateTime, med);
                                        const instructionText = med.split(' - ')[1];
                                        if (deadline) {
                                            return (
                                                <>
                                                    Suspender antes del{' '}
                                                    <span className="font-semibold">
                                                        {deadline.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </span>.
                                                </>
                                            );
                                        }
                                        return <span className="font-semibold">{instructionText || 'Revisar indicación.'}</span>;
                                    })()}
                                </li>
                           ))}
                        </ul>
                     </div>
                )}
              </div>
            )}
        </aside>
      </div>

      {cameraState.open && (
        <Modal onClose={() => setCameraState({open: false, type: null})}>
          <CameraCapture onConfirm={handleSignatureConfirm} onClose={() => setCameraState({open: false, type: null})} />
        </Modal>
      )}
    </div>
  );
};

export default PatientConsentView;