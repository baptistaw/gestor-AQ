/* components/icons.tsx
   ─────────────────── */
import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/* Utilidad para no repetir boiler‑plate */
const make = (d: string) => (props: IconProps) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/* ───── LISTA ÚNICA de iconos ───── */
export const PlusIcon          = make("M12 4v16M4 12h16");
export const DocumentPlusIcon  = make("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M12 12v4 M10 14h4");
export const CameraIcon        = make("M5 7h14l-1.5-2h-11L5 7zm14 0v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7h14zm-7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z");
export const ArrowPathIcon     = make("M4 4v6h6M20 20v-6h-6 M5 19A9 9 0 0 0 19 5");
export const BriefcaseIcon     = make("M4 7h16v11H4z M9 7V4h6v3");
export const UserIcon          = make("M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm7 10H5a9 9 0 0 1 14 0z");
export const InformationCircleIcon = make("M12 17h.01M12 11v4M12 7h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z");
export const ShieldCheckIcon   = make("M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z M9 12l2 2 4-4");
export const ArrowRightOnRectangleIcon = make("M16 17l5-5-5-5M21 12H9M4 4h5M4 20h5M4 4v16");
export const BellAlertIcon     = make("M18 8a6 6 0 0 0-12 0v5H4l2 2h12l2-2h-2V8 M13.73 21a2 2 0 0 1-3.46 0");
export const CheckCircleIcon   = make("M9 12l2 2 4-4 M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z");
export const ClockIcon         = make("M12 6v6l4 2 M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z");
export const EnvelopeIcon      = make("M4 4h16v16H4z M22 6l-10 7L2 6");
export const QrCodeIcon        = make("M3 3h8v8H3z M13 3h8v4h-8z M13 9h4v2h-4z M3 13h4v2H3z M9 13h2v8H3v-2h6z M13 13h8v8h-8z");
