/* AdminLogin.tsx – formulario super‐simple */
import * as React from 'react';
import { AdminLoginDTO } from '../types.ts';

const { useState } = React;

interface Props {
  onSuccess: (admin: { id: string; firstName: string; lastName: string }) => void;
  apiUrl: string;
}

const AdminLogin: React.FC<Props> = ({ onSuccess, apiUrl }) => {
  const [form, setForm] = useState<AdminLoginDTO>({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const r = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) return setError(data.message || 'Credenciales inválidas');
      onSuccess(data);
    } catch {
      setError('Error de conexión');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto space-y-4 bg-white p-6 rounded-xl shadow-lg"
    >
      <h1 className="text-2xl font-bold mb-2 text-center">Ingreso Admin</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <input
        type="email"
        name="email"
        placeholder="E‑mail"
        className="w-full border px-3 py-2 rounded-md"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        className="w-full border px-3 py-2 rounded-md"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button
        type="submit"
        className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-md"
      >
        Entrar
      </button>
    </form>
  );
};

export default AdminLogin;
