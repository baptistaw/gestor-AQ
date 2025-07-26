// frontend/index.tsx -------------------------------------------------
import React       from "react";
import { createRoot } from "react-dom/client";
import App         from "./App.tsx";

const API_BASE: string =
  (window as any).APP_CONFIG?.API_BASE_URL ?? "http://localhost:4000/api";

export const api = {
  get: (path: string, init?: RequestInit) =>
    fetch(`${API_BASE}${path}`, init).then(r =>
      r.ok ? r.json() : Promise.reject(r)
    ),
};

const container = document.getElementById("root");
if (!container) throw new Error("No se encontró #root");

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
