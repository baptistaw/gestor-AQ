import * as React from 'react';
import { Admin } from '../types';

interface Props {
  onSuccess: (a: Admin) => void;
}

export default function AdminLogin({ onSuccess }: Props) {
  const [email, setEmail]       = React.useState('admin@demo.com');
  const [password, setPassword] = React.useState('admin123');
  const [error, setError]       = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) throw new Error('Credenciales inválidas');
      const data: Admin = await r.json();
      onSuccess(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xs mx-auto mt-24 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Acceso Admin</h1>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="E‑mail"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Contraseña"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />
        <button className="w-full bg-slate-700 text-white py-2 rounded">
          Entrar
        </button>
      </form>
    </div>
  );
}
