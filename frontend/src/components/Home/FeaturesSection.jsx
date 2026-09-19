import React from "react";
import {
  TrendingUp,
  UsersRound,
  Crown,
  BookmarkCheck,
  ClockArrowUp,
} from "lucide-react";
import FeatureChip from "./FeatureChip";

export default function FeaturesSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 mt-24 pb-20">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold font-vend">Built for Engagement</h2>
        <p
          className="
                    text-slate-500 dark:text-slate-400 
                    mt-2 text-sm md:text-base
                "
        >
          Everything you need for a great quizzing experience.
        </p>
      </div>

      <div
        className="
                grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
                gap-6 mt-12
            "
      >
        <FeatureChip
          icon={
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          }
          text="Flexible Formats"
          description="Supports Single Choice, Multi-Answer Checkboxes, True/False, and Fill-in-the-Blank."
        />
        <FeatureChip
          icon={
            <UsersRound className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          }
          text="Host Dashboard"
          description="Manage drafts, publish quizzes, and control leaderboard visibility."
        />
        <FeatureChip
          icon={
            <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          }
          text="Live Standings"
          description="Real-time leaderboard ranks participants with automatic lock protection."
        />
        <FeatureChip
          icon={
            <BookmarkCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          }
          text="Progress Recovery"
          description="Draft responses auto-save, surviving accidental page reloads."
        />
        <FeatureChip
          icon={
            <ClockArrowUp className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          }
          text="Strict Timers"
          description="Server-validated timers ensure everyone gets exactly the same amount of time."
        />
      </div>
    </section>
  );
}
