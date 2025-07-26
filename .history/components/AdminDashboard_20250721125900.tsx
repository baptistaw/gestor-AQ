import * as React from 'react';
import { Admin, HealthProvider } from '../types';

interface Props {
  admin: Admin;
  onLogout: () => void;
}

export default function AdminDashboard({ admin, onLogout }: Props) {
  const [providers, setProviders] = React.useState<HealthProvider[]>([]);
  const [name, setName]           = React.useState('');
  const [err, setErr]             = React.useState('');

  const fetchProviders = React.useCallback(async () => {
    const r = await fetch('/api/providers');
    setProviders(await r.json());
  }, []);

  React.useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const addProvider = async () => {
    if (!name.trim()) return;
    try {
      const r = await fetch('/api/providers', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name }),
      });
      if (!r.ok) throw new Error('Nombre duplicado');
      setName('');
      fetchProviders();
    } catch (e:any) { setErr(e.message); }
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Admin Dashboard · {admin.firstName}
        </h1>
        <button onClick={onLogout} className="text-slate-600 underline">
          Cerrar sesión
        </button>
      </header>

      <section className="max-w-md">
        <h2 className="text-xl font-bold mb-3">Prestadores de Salud</h2>
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Nuevo prestador"
            value={name}
            onChange={e=>setName(e.target.value)}
          />
          <button
            onClick={addProvider}
            className="bg-indigo-600 text-white px-4 rounded"
          >
            Añadir
          </button>
        </div>
        <ul className="space-y-1 list-disc pl-5">
          {providers.map(p=>(
            <li key={p.id}>{p.name}</li>
          ))}
          {providers.length===0 && <li className="list-none text-slate-500">Sin registros</li>}
        </ul>
      </section>
    </div>
  );
}
