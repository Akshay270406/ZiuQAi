import { useAuth } from "../context/AuthProvider";
import HeroSection from "../components/Home/HeroSection";
import InteractiveSampleQuiz from "../components/Home/InteractiveSampleQuiz";
import HowItWorksSection from "../components/Home/HowItWorksSection";
import FeaturesSection from "../components/Home/FeaturesSection";
import CtaSection from "../components/Home/CtaSection";

export default function Home() {
  const { user } = useAuth();

  return (
    <div
      className="
            w-full min-h-screen pt-10
            bg-slate-50 dark:bg-slate-900 
            text-slate-800 dark:text-slate-100 
            font-roboto transition-colors
        "
    >
      <HeroSection user={user} />
      <InteractiveSampleQuiz />
      <HowItWorksSection />
      <FeaturesSection />
      <CtaSection user={user} />
    </div>
  );
}
