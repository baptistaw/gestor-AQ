/* ------------------------------------------------------------------
   Icon set unificado – SÓLO estos exports se usan en la aplicación.
   Todos son SVG “outline” de 24 × 24 px compatibles con Tailwind.
   ------------------------------------------------------------------ */
import * as React from 'react';

export interface IconProps
  extends React.SVGProps<SVGSVGElement> { className?: string }

/* Helper para no repetir boilerplate */
const Svg: React.FC<IconProps & { d: string }> = ({ d, ...p }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d={d} />
  </svg>
);

/* ---------- ICONOS PRINCIPALES ---------- */

/* Briefcase  (maletín) */
export const BriefcaseIcon = (p: IconProps) =>
  <Svg {...p} d="M2 7h20v13H2zM16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />;

/* User */
export const UserIcon = (p: IconProps) =>
  <Svg {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;

/* Shield‑check */
export const ShieldCheckIcon = (p: IconProps) =>
  <Svg {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />;

/* Information circle */
export const InformationCircleIcon = (p: IconProps) =>
  <Svg {...p} d="M12 12v4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />;

/* Plus (único, sin duplicados) */
export const PlusIcon = (p: IconProps) =>
  <Svg {...p} d="M12 5v14M5 12h14" />;

/* Document +  (usado en panel Admin/Anesth) */
export const DocumentPlusIcon = (p: IconProps) =>
  <Svg {...p} d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM14 2v5h5M12 11v6M9 14h6" />;

/* Check‑circle */
export const CheckCircleIcon = (p: IconProps) =>
  <Svg {...p} d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />;

/* Clock */
export const ClockIcon = (p: IconProps) =>
  <Svg {...p} d="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />;

/* Arrow‑right‑on‑rectangle (logout) */
export const ArrowRightOnRectangleIcon = (p: IconProps) =>
  <Svg {...p} d="M16 17l5-5-5-5M21 12H9M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />;

/* Bell‑alert */
export const BellAlertIcon = (p: IconProps) =>
  <Svg {...p} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />;

/* Envelope */
export const EnvelopeIcon = (p: IconProps) =>
  <Svg {...p} d="M4 4h16v16H4zM22 6l-10 7L2 6" />;

/* QR‑code (simple) */
export const QrCodeIcon = (p: IconProps) =>
  <Svg {...p} d="M3 3h5v5H3zM16 3h5v5h-5zM3 16h5v5H3zM12 8h1v8h-1zM8 12h8v1H8zM16 16h5v5h-5z" />;

/* Arrow‑path / refresh (para CameraCapture) */
export const ArrowPathIcon = (p: IconProps) =>
  <Svg {...p} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-5l3 3M20 15a9 9 0 0 1-15 5l-3-3" />;

/* Camera (para CameraCapture) */
export const CameraIcon = (p: IconProps) =>
  <Svg {...p} d="M23 19V7a2 2 0 0 0-2-2h-3.17l-1.41-1.41A2 2 0 0 0 15.17 3H8.83a2 2 0 0 0-1.42.59L6 5H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2zM12 17a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />;
