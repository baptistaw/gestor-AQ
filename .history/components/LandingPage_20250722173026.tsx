/* components/LandingPage.tsx */
import React from 'react';
import {
  BriefcaseIcon,
  UserIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from './icons.tsx';

export interface LandingPageProps {
  onSwitchToAdminLogin:            () => void;
  onSwitchToSurgeonLogin:          () => void;
  onSwitchToAnesthesiologistLogin: () => void;
  onSwitchToPatientView:           () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onSwitchToAdminLogin,
  onSwitchToSurgeonLogin,
  onSwitchToAnesthesiologistLogin,
  onSwitchToPatientView,
}) => (
  /* ——— mismo JSX que ya tenías ——— */
  /* (sin cambios) */
);

export default LandingPage;
