import React from 'react';
import { createRoot } from 'react-dom/client';

/* Tu componente principal sigue donde siempre */
import App from '../App.tsx';          // ajusta la ruta si tu App.tsx está en otra carpeta

const container = document.getElementById('root');
if (!container) throw new Error('No se encontró #root');

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
