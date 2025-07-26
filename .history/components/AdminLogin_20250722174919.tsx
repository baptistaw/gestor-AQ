import * as React from 'react';
const { useState } = React;

interface Props {
  apiUrl: string;
  onSuccess: (admin: any) => void;
}

const AdminLogin: React.FC<Props> = ({ apiUrl, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const r = await fetch(`${apiUrl}/api/admin/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok) return setError(data.message || 'Credenciales incorrectas');
    onSuccess(data);
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4 text-center">Acceso Admin</h2>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md" required />
        <input type="password" placeholder="Contraseña"
          value={password} onChange={e=>setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md" required />
          <button className="btn-primary w-full">Entrar</button>

      </form>
    </div>
  );
};

export default AdminLogin;
