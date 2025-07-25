/*  frontend/components/AdminDashboard.tsx
    ────────────────────────────────────── */

import * as React from 'react';
const { useState, useEffect, useCallback } = React;

import {
  Admin,
  HealthProvider,
  CreateProviderDTO,
  CreateProfessionalDTO,
} from '../types.ts';

import {
  /* icons ya existentes … */
  UserPlusIcon,
  DocumentPlusIcon,          // ✔️  usamos este en lugar de PlusIcon
  ArrowRightOnRectangleIcon,
} from './icons.tsx';

interface Props {
  admin:    Admin;
  apiUrl:   string;
  onLogout: () => void;
}

const AdminDashboard: React.FC<Props> = ({ admin, apiUrl, onLogout }) => {
  /* ────────────────  state  ──────────────── */
  const [providers, setProviders] = useState<HealthProvider[]>([]);
  const [provForm, setProvForm]   = useState<Omit<CreateProviderDTO,'phone'>>( { name:'', address:'', contactEmail:'' } );
  const [provErr,  setProvErr]    = useState('');

  /* form para crear profesional */
  const initialProf: CreateProfessionalDTO = {
    providerId:'', role:'SURGEON',
    firstName:'', lastName:'', license:'', password:'',
  };
  const [profForm, setProfForm] = useState<CreateProfessionalDTO>(initialProf);
  const [profErr,  setProfErr]  = useState('');

  /* ──────────── helpers ──────────── */
  const fetchProviders = useCallback(async () => {
    const r = await fetch(`${apiUrl}/api/providers`);
    if (r.ok) setProviders(await r.json());
  }, [apiUrl]);

  /* ──────────────────────────────────
     carga inicial de prestadores
  ────────────────────────────────── */
  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  /* ──────────────────────────────────
     crear proveedor
  ────────────────────────────────── */
  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvErr('');
    try {
      const r = await fetch(`${apiUrl}/api/providers`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(provForm),
      });
      if(!r.ok){
        const d = await r.json();
        throw new Error(d.message ?? 'Error desconocido');
      }
      setProvForm({ name:'', address:'', contactEmail:'' });
      fetchProviders();
    } catch(err:any){
      setProvErr(err.message);
    }
  };

  /* ──────────────────────────────────
     crear profesional
  ────────────────────────────────── */
  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfErr('');
    try {
      const r = await fetch(`${apiUrl}/api/professionals`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(profForm),
      });
      if(!r.ok){
        const d = await r.json();
        throw new Error(d.message ?? 'Error desconocido');
      }
      setProfForm(initialProf);
      alert('Profesional creado 👍');
    } catch(err:any){
      setProfErr(err.message);
    }
  };

  /* ──────────────────────────────────
     UI
  ──────────────────────────────────*/
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">
          Panel de Administración
        </h1>
        <button onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
          Cerrar sesión
          <ArrowRightOnRectangleIcon className="h-5 w-5"/>
        </button>
      </header>

      {/* Bienvenida */}
      <p className="text-slate-600">
        Bienvenido&nbsp;
        <span className="font-semibold">{admin.firstName} {admin.lastName}</span>
      </p>

      {/* Grid columnas */}
      <div className="grid md:grid-cols-2 gap-8 items-start">

        {/* ────────── PROVEEDORES ────────── */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DocumentPlusIcon className="h-5 w-5 text-emerald-500"/>
            Crear Prestador de Salud
          </h2>

          {provErr && <p className="text-red-600 text-sm mb-2">{provErr}</p>}
          <form onSubmit={handleCreateProvider} className="space-y-3">
            <input className="input w-full" placeholder="Nombre"
              value={provForm.name}
              onChange={e=>setProvForm({...provForm,name:e.target.value})}
              required/>
            <input className="input w-full" placeholder="Dirección"
              value={provForm.address}
              onChange={e=>setProvForm({...provForm,address:e.target.value})}/>
            <input className="input w-full" type="email"
              placeholder="Email de contacto"
              value={provForm.contactEmail}
              onChange={e=>setProvForm({...provForm,contactEmail:e.target.value})}/>
            <button className="btn-primary w-full">Guardar</button>
          </form>

          {/* lista */}
          <h3 className="font-semibold mt-8 mb-2">Prestadores registrados</h3>
          <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {providers.map(p=>(
              <li key={p.id} className="text-sm text-slate-700 truncate">
                • {p.name}
              </li>
            ))}
            {!providers.length && <li className="text-slate-500">Sin registros</li>}
          </ul>
        </section>

        {/* ────────── PROFESIONALES ────────── */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-indigo-500"/>
            Crear Profesional
          </h2>

          {profErr && <p className="text-red-600 text-sm mb-2">{profErr}</p>}
          <form onSubmit={handleCreateProfessional} className="space-y-3">
            <select className="input w-full"
              value={profForm.role}
              onChange={e=>setProfForm({...profForm,role:e.target.value as any})}>
              <option value="SURGEON">Cirujano(a)</option>
              <option value="ANESTHESIOLOGIST">Anestesiólogo(a)</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Nombre"
                value={profForm.firstName}
                onChange={e=>setProfForm({...profForm,firstName:e.target.value})} required/>
              <input className="input" placeholder="Apellido"
                value={profForm.lastName}
                onChange={e=>setProfForm({...profForm,lastName:e.target.value})} required/>
            </div>

            <input className="input w-full" placeholder="N° de licencia"
              value={profForm.license}
              onChange={e=>setProfForm({...profForm,license:e.target.value})} required/>

            <input className="input w-full" type="password" placeholder="Contraseña"
              value={profForm.password}
              onChange={e=>setProfForm({...profForm,password:e.target.value})} required/>

            <select className="input w-full"
              value={profForm.providerId}
              onChange={e=>setProfForm({...profForm,providerId:e.target.value})}
              required>
              <option value="">— Seleccione Prestador —</option>
              {providers.map(p=>(
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button className="btn-primary w-full">Crear Profesional</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
