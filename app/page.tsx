import { FeatureSection } from '@/src/components/landing/FeatureSection';
import { HeroSection } from '@/src/components/landing/HeroSection';
import { HowItWorksSection } from '@/src/components/landing/HowItWorksSection';
import { LandingCTA } from '@/src/components/landing/LandingCTA';
import { LandingFooter } from '@/src/components/landing/LandingFooter';
import { LandingNavbar } from '@/src/components/landing/LandingNavbar';
import { ProblemSection } from '@/src/components/landing/ProblemSection';
import { RoadmapSection } from '@/src/components/landing/RoadmapSection';
import { RoleSection } from '@/src/components/landing/RoleSection';
import { SecurityControlSection } from '@/src/components/landing/SecurityControlSection';
import { UseCasesSection } from '@/src/components/landing/UseCasesSection';

export default function LandingPage() {
  return (
    <div className="public-shell selection:bg-slate-900 selection:text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeatureSection />
        <SecurityControlSection />
        <UseCasesSection />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
