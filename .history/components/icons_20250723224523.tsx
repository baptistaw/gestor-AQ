import { ComponentProps } from 'react';
import {
  Briefcase         as BriefcaseSvg,
  User              as UserSvg,
  ShieldCheck       as ShieldCheckSvg,
  Info              as InfoSvg,
  Plus              as PlusSvg,
  FilePlus2         as FilePlusSvg,      // «Documento +»
  RotateCcw         as ArrowPathSvg,     // «flecha circular»
  Camera            as CameraSvg,
  QrCode            as QrCodeSvg,
  BellRing          as BellAlertSvg,
  CheckCircle       as CheckCircleSvg,
  Clock             as ClockSvg,
  LogOut            as ArrowRightSvg,
  Mail              as EnvelopeSvg,
} from 'lucide-react';

export type IconProps = ComponentProps<'svg'>;

/*  Exporta *una sola vez* cada icono — sin duplicados  */
export const BriefcaseIcon          = (p:IconProps)=><BriefcaseSvg   {...p}/>;
export const UserIcon               = (p:IconProps)=><UserSvg        {...p}/>;
export const ShieldCheckIcon        = (p:IconProps)=><ShieldCheckSvg {...p}/>;
export const InformationCircleIcon  = (p:IconProps)=><InfoSvg        {...p}/>;

export const PlusIcon               = (p:IconProps)=><PlusSvg        {...p}/>;
export const DocumentPlusIcon       = (p:IconProps)=><FilePlusSvg    {...p}/>;
export const ArrowPathIcon          = (p:IconProps)=><ArrowPathSvg   {...p}/>;
export const CameraIcon             = (p:IconProps)=><CameraSvg      {...p}/>;

export const QrCodeIcon             = (p:IconProps)=><QrCodeSvg      {...p}/>;
export const BellAlertIcon          = (p:IconProps)=><BellAlertSvg   {...p}/>;
export const CheckCircleIcon        = (p:IconProps)=><CheckCircleSvg {...p}/>;
export const ClockIcon              = (p:IconProps)=><ClockSvg       {...p}/>;
export const ArrowRightOnRectangleIcon = (p:IconProps)=><ArrowRightSvg {...p}/>;
export const EnvelopeIcon           = (p:IconProps)=><EnvelopeSvg    {...p}/>;
