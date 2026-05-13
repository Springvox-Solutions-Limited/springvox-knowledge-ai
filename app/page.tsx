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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.12),transparent_30%),linear-gradient(180deg,#0B0C0E_0%,#090A0C_100%)] text-[#E2E8F0]">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <RoleSection />
        <FeatureSection />
        <UseCasesSection />
        <RoadmapSection />
        <SecurityControlSection />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
