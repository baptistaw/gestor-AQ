import * as React from 'react';
const { useState, useEffect } = React;

import { Admin, HealthProvider, CreateProviderDTO } from '../../../types.tsx';

interface Props {
  admin: Admin;
  onLogout: () => void;
}

const API_URL = (window as any).APP_CONFIG.API_URL;

const AdminDashboard: React.FC<Props> = ({ admin, onLogout }) => {
  const [providers, setProviders] = useState<HealthProvider[]>([]);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm] = useState<CreateProviderDTO>({
    name: '', address: '', phone: '', contactEmail: ''
  });
  const [error, setError] = useState('');

  /* --- Load providers once --- */
  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    const r = await fetch(`${API_URL}/api/providers`);
    if (r.ok) setProviders(await r.json());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/api/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setProviders(p => [...p, data].sort((a,b)=>a.name.localeCompare(b.name)));
      setShowModal(false);
      setForm({ name:'', address:'', phone:'', contactEmail:'' });
      setError('');
    } catch (err:any) { setError(err.message); }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Panel Administrador</h1>
        <button onClick={onLogout}
          className="px-4 py-2 bg-slate-600 text-white rounded-md">
          Cerrar sesión
        </button>
      </header>

      {/* -------- Lista de Prestadores -------- */}
      <section className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Prestadores de Salud</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
          >
            Nuevo
          </button>
        </div>

        {providers.length === 0 ? (
          <p className="text-slate-500">Sin registros.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-1">Nombre</th>
                <th className="py-1">Dirección</th>
                <th className="py-1">Teléfono</th>
                <th className="py-1">Email</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="py-1">{p.name}</td>
                  <td className="py-1">{p.address}</td>
                  <td className="py-1">{p.phone}</td>
                  <td className="py-1">{p.contactEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* -------- Modal Nuevo Prestador ------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Nuevo Prestador</h3>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              {(['name','address','phone','contactEmail'] as const).map(k => (
                <div key={k}>
                  <label className="block text-xs font-medium capitalize" htmlFor={k}>{k}</label>
                  <input id={k} required={k==='name'}
                    value={form[k] ?? ''}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"/>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)}
                  className="px-4 py-2 rounded-md bg-slate-100">Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
