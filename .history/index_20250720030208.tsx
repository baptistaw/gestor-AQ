// frontend/index.tsx
//------------------------------------------------------------
// Punto de entrada de tu SPA (compila a ES‑modules).
//------------------------------------------------------------
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

//------------------------------------------------------------
// 1. Rescatamos la URL base del backend que expuso /config.js
//------------------------------------------------------------
const API_BASE: string =
  (window as any).APP_CONFIG?.API_BASE_URL ?? "http://localhost:4000/api";

// Ejemplo de cómo usarla globalmente:
export const api = {
  get: (path: string, init?: RequestInit) =>
    fetch(`${API_BASE}${path}`, init).then((r) =>
      r.ok ? r.json() : Promise.reject(r)
    ),
};

//------------------------------------------------------------
// 2. Montamos React en #root
//------------------------------------------------------------
const container = document.getElementById("root");
if (!container) throw new Error("No se encontró el nodo #root");

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
