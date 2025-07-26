/* ───────────────────────────────────────────────
   Iconos SVG locales — cero dependencias externas
───────────────────────────────────────────────── */

import React from 'react';

/** Props genéricas para cada <svg> */
export type IconProps = React.SVGProps<SVGSVGElement>;

/* Helper que fija atributos comunes */
const Svg = (p: IconProps & { d: string }) => (
  <svg
    {...p}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={p.strokeWidth ?? 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={p.d} />
  </svg>
);

/* === Exporta sólo UNA vez cada icono que tu app usa === */

/* Maletín / Briefcase */
export const BriefcaseIcon = (p: IconProps) =>
  <Svg {...p} d="M3 7h18v13H3z M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />;

/* Usuario / User */
export const UserIcon = (p: IconProps) =>
  <Svg {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />;

/* Escudo ✓ / Shield Check */
export const ShieldCheckIcon = (p: IconProps) =>
  <Svg {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4" />;

/* Círculo info / InformationCircle */
export const InformationCircleIcon = (p: IconProps) =>
  <Svg {...p} d="M12 12v4 M12 8h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />;

/* Flecha salir / Log Out (ArrowRightOnRectangle) */
export const ArrowRightOnRectangleIcon = (p: IconProps) =>
  <Svg {...p} d="M16 17l5-5-5-5 M21 12H8 M8 21H3V3h5" />;

/* Check circle */
export const CheckCircleIcon = (p: IconProps) =>
  <Svg {...p} d="M9 12l2 2 4-4 M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" />;

/* Reloj / Clock */
export const ClockIcon = (p: IconProps) =>
  <Svg {...p} d="M12 8v4l3 3 M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" />;

/* QR‑code */
export const QrCodeIcon = (p: IconProps) =>
  <Svg {...p} d="M3 3h5v5H3z M16 3h5v5h-5z M3 16h5v5H3z M14 14h1v1h-1z M15 15h5v5h-5z M12 3h1v5h-1z" />;

/* Campana alerta / Bell Alert */
export const BellAlertIcon = (p: IconProps) =>
  <Svg {...p} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" />;

/* Sobre / Envelope */
export const EnvelopeIcon = (p: IconProps) =>
  <Svg {...p} d="M4 4h16v16H4z M22 6l-10 7L2 6" />;

/* PLUS (única y definitiva) */
export const PlusIcon = (p: IconProps) =>
  <Svg {...p} d="M12 5v14M5 12h14" />;

/* ─────────────────────────────────────────────── */
