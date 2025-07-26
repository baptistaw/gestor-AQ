/* components/icons.tsx
   ------------------------------------------------------------ */
import React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  className?: string;
};

/* Utilidad para simplificar la creación de iconos */
const icon = (
  path: React.ReactNode,
  viewBox = "0 0 24 24"
): React.FC<IconProps> => (props) =>
  (
    <svg
      {...props}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );

/* ---------- ICONOS QUE REALMENTE USAS ---------- */

/* Landing + Dashboards */
export const BriefcaseIcon      = icon(<path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M3 7h18v13H3Z" />);
export const UserIcon           = icon(<path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />);
export const ShieldCheckIcon    = icon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>);
export const InformationCircleIcon = icon(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>);
export const ArrowRightOnRectangleIcon = icon(<path d="M11 16l4-4-4-4M15 12H3M19 4h-5a2 2 0 0 0-2 2v2m0 8v2a2 2 0 0 0 2 2h5" />);

/* Cirujano / Anestesiólogo */
export const UserPlusIcon       = icon(<path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />);
export const CheckCircleIcon    = icon(<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>);
export const ClockIcon          = icon(<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>);
export const QrCodeIcon         = icon(<><path d="M3 11V3h8v8H3Z" /><path d="M13 3h8v8h-8V3Z" /><path d="M3 13h8v8H3v-8Z" /><path d="M17 13h4v4h-4v-4ZM21 17h-4v4" /></>);
export const BellAlertIcon      = icon(<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>);
export const EnvelopeIcon       = icon(<><path d="M4 4h16v16H4z" /><path d="m22 6-10 7L2 6" /></>);

/* Administrador */
export const PlusIcon           = icon(<path d="M12 5v14M5 12h14" />);
export const DocumentPlusIcon   = icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 11v6M9 14h6" /></>);

/* Cámara / Captura */
export const CameraIcon         = icon(<><circle cx="12" cy="13" r="4" /><path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /></>);
export const ArrowPathIcon      = icon(<path d="M12 5V3m0 0L8 7m4-4 4 4M12 19v2m0 0 4-4m-4 4-4-4M5 12H3m0 0 4-4m-4 4 4 4M21 12h-2m0 0-4-4m4 4-4 4" />);

/* ---------- FIN ---------- */
