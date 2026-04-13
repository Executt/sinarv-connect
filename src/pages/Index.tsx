import GovHeader from "@/components/landing/GovHeader";
import HeroSection from "@/components/landing/HeroSection";
import QuickAccessCards from "@/components/landing/QuickAccessCards";
import SustainabilityIndicators from "@/components/landing/SustainabilityIndicators";
import GovFooter from "@/components/landing/GovFooter";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GovHeader />
      <main className="flex-1">
        <HeroSection />
        <QuickAccessCards />
        <SustainabilityIndicators />
      </main>
      <GovFooter />
    </div>
  );
};

export default Index;
