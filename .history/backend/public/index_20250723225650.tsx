import React   from 'react';
import { createRoot } from 'react-dom/client';

import App from '/App.tsx';      // ruta absoluta desde public/

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
