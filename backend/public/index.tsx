// backend/public/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";      // ← relativo al mismo directorio

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No se encontró el elemento #root");

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
