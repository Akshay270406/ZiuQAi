import React from "react";
import { FilePlusCorner, ClipboardPen, Crown } from "lucide-react";
import TutorialStep from "./TutorialStep";

export default function HowItWorksSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 mt-16">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-3xl font-bold font-vend">How It Works</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Get your quiz running in three simple steps.
        </p>
      </div>

      <div
        className="
                grid grid-cols-1 md:grid-cols-3 
                gap-8 mt-12
            "
      >
        <TutorialStep
          step="01"
          icon={
            <FilePlusCorner className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          }
          text="Create Questions"
          description="Build your quiz with multiple choice, true/false, or fill-in-the-blank questions."
        />
        <TutorialStep
          step="02"
          icon={
            <ClipboardPen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          }
          text="Host the Session"
          description="Share your unique quiz link or code with participants."
        />
        <TutorialStep
          step="03"
          icon={
            <Crown className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          }
          text="Track Standings"
          description="Watch the live leaderboard as participants complete the quiz."
        />
      </div>
    </section>
  );
}
