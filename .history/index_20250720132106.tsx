// frontend/index.tsx
//------------------------------------------------------------
// Punto de entrada de tu SPA (compila a ES‑modules).
//------------------------------------------------------------
import React, { StrictMode }   from 'react';
import { createRoot }          from 'react-dom/client';   // ⬅️  exportación nombrada ✔
import App                     from './App.tsx';

//------------------------------------------------------------
// 1. URL base del backend expuesta por /config.js
//------------------------------------------------------------
const API_BASE: string =
  (window as any).APP_CONFIG?.API_BASE_URL ?? 'http://localhost:4000/api';

// Helper global (puedes exportar otros metodos si los necesitas)
export const api = {
  get : (path: string, init?: RequestInit) =>
          fetch(`${API_BASE}${path}`, init).then(r =>
            r.ok ? r.json() : Promise.reject(r)),
  post: (path: string, body: unknown, init: RequestInit = {}) =>
          fetch(`${API_BASE}${path}`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
            body   : JSON.stringify(body),
            ...init
          }).then(r => (r.ok ? r.json() : Promise.reject(r)))
};

//------------------------------------------------------------
// 2. Montamos React en #root
//------------------------------------------------------------
const container = document.getElementById('root');
if (!container) throw new Error('No se encontró el nodo #root');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
