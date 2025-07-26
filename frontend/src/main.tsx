//-------------------------------------------------------------
//  Punto de entrada de tu SPA (ES‑Modules + import‑map)      //
//-------------------------------------------------------------
import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

//-------------------------------------------------------------
//  Config leída de /config.js (inyectada en window)          //
//-------------------------------------------------------------
declare global {
  interface Window {
    APP_CONFIG?: { API_BASE_URL?: string };
  }
}

export const API_BASE_URL: string =
  window.APP_CONFIG?.API_BASE_URL ?? "http://localhost:4000/api";

// Helper de red reutilizable
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Error ${res.status}`);
  }
  // 204 → sin contenido
  return (res.status === 204 ? null : await res.json()) as T;
}

//-------------------------------------------------------------
//  Montaje de React 18                                       //
//-------------------------------------------------------------
const container = document.getElementById("root");
if (!container) throw new Error("No se encontró #root");

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
