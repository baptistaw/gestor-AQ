// components/icons.tsx
import * as React from 'react';
import type { SVGProps } from 'react';
import {
  // Lucide icons
  BriefcaseIcon  as LucideBriefcase,
  UserIcon       as LucideUser,
  ShieldCheckIcon       as LucideShieldCheck,
  InformationCircleIcon as LucideInfo,
  UserPlusIcon          as LucideUserPlus,
  ArrowRightOnRectangleIcon as LucideLogout,
  CheckCircleIcon       as LucideCheck,
  ClockIcon             as LucideClock,
  QrCodeIcon            as LucideQr,
  BellAlertIcon         as LucideBell,
  EnvelopeIcon          as LucideEnvelope,
  ArrowPathIcon         as LucideReload,
  CameraIcon            as LucideCamera,
  DocumentPlusIcon      as LucideDocPlus,
  PlusIcon              as LucidePlus,
} from 'lucide-react';

export const BriefcaseIcon: React.FC<SVGProps<SVGSVGElement>> = props => <LucideBriefcase {...props} />;
export const UserIcon:      React.FC<SVGProps<SVGSVGElement>> = props => <LucideUser {...props} />;
export const ShieldCheckIcon: React.FC<SVGProps<SVGSVGElement>> = props => <LucideShieldCheck {...props} />;
export const InformationCircleIcon: React.FC<SVGProps<SVGSVGElement>> = props => <LucideInfo {...props} />;
export const UserPlusIcon:  React.FC<SVGProps<SVGSVGElement>> = props => <LucideUserPlus {...props} />;
export const ArrowRightOnRectangleIcon: React.FC<SVGProps<SVGSVGElement>> = props => <LucideLogout {...props} />;
export const CheckCircleIcon: React.FC<SVGProps<SVGSVGElement>> = props => <LucideCheck {...props} />;
export const ClockIcon:      React.FC<SVGProps<SVGSVGElement>> = props => <LucideClock {...props} />;
export const QrCodeIcon:     React.FC<SVGProps<SVGSVGElement>> = props => <LucideQr {...props} />;
export const BellAlertIcon:  React.FC<SVGProps<SVGSVGElement>> = props => <LucideBell {...props} />;
export const EnvelopeIcon:   React.FC<SVGProps<SVGSVGElement>> = props => <LucideEnvelope {...props} />;
export const ArrowPathIcon:  React.FC<SVGProps<SVGSVGElement>> = props => <LucideReload {...props} />;
export const CameraIcon:     React.FC<SVGProps<SVGSVGElement>> = props => <LucideCamera {...props} />;
export const DocumentPlusIcon: React.FC<SVGProps<SVGSVGElement>> = props => <LucideDocPlus {...props} />;
export const PlusIcon:       React.FC<SVGProps<SVGSVGElement>> = props => <LucidePlus {...props} />;
