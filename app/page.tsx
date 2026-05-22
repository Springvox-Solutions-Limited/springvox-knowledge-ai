import { PremiumLandingPage } from '@/src/components/landing/PremiumLandingPage';
import { LandingFooter } from '@/src/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="selection:bg-cyan-300 selection:text-slate-950">
      <PremiumLandingPage />
      <LandingFooter />
    </div>
  );
}
