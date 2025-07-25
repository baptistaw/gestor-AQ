/* ────────────────────────────────────────────────
   Iconos centralizados
────────────────────────────────────────────────── */

import React from 'react';
import {
  Briefcase,
  User,
  ShieldCheck,
  Info,
  LogOut,
  CheckCircle,
  Clock,
  QrCode,
  BellRing,
  Mail,
  Plus,
} from 'lucide-react';

/** Tipo genérico para todos los iconos — incluye className, size, etc. */
export type IconProps = React.ComponentProps<'svg'>;

/* === Wrapper sencillo que expone cada ícono con un nombre descriptivo === */

export const BriefcaseIcon              = (p: IconProps) => <Briefcase   {...p} />;
export const UserIcon                   = (p: IconProps) => <User        {...p} />;
export const ShieldCheckIcon            = (p: IconProps) => <ShieldCheck {...p} />;
export const InformationCircleIcon      = (p: IconProps) => <Info        {...p} />;
export const ArrowRightOnRectangleIcon  = (p: IconProps) => <LogOut      {...p} />;
export const CheckCircleIcon            = (p: IconProps) => <CheckCircle {...p} />;
export const ClockIcon                  = (p: IconProps) => <Clock       {...p} />;
export const QrCodeIcon                 = (p: IconProps) => <QrCode      {...p} />;
export const BellAlertIcon              = (p: IconProps) => <BellRing    {...p} />;
export const EnvelopeIcon               = (p: IconProps) => <Mail        {...p} />;
export const PlusIcon                   = (p: IconProps) => <Plus        {...p} />;

/* ─────────────────────────────────────────────── */
