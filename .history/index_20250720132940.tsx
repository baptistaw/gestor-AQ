//------------------------------------------------------------
//  Punto de entrada de tu SPA                               //
//  • Compila a ES‑modules (esbuild / ts-loader / Vite).     //
//  • React 18 + import‑map único (fijado en index.html).     //
//------------------------------------------------------------
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

//------------------------------------------------------------
// 1.  Config global inyectada por <script src="/config.js">  //
//     – allí deberías establecer algo como:                 //
//       window.APP_CONFIG = { API_BASE_URL: "…" }           //
//------------------------------------------------------------
declare global {
  interface Window {
    APP_CONFIG?: { API_BASE_URL?: string };
  }
}

export const API_BASE_URL: string =
  window.APP_CONFIG?.API_BASE_URL ?? "http://localhost:4000/api";

//------------------------------------------------------------
// 2.  Helper de red: fetch() con base‑URL                    //
//------------------------------------------------------------
export function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`, init).then(async (res) => {
    if (!res.ok) {
      // Devuelve texto legible si el backend lo envía
      const message = (await res.text().catch(() => "")) || res.statusText;
      throw new Error(message);
    }
    return (res.status === 204 ? null : await res.json()) as T;
  });
}

//------------------------------------------------------------
// 3.  Montaje de React                                       //
//------------------------------------------------------------
const container = document.getElementById("root");
if (!container) throw new Error("No se encontró el nodo #root");

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
