import React from "react";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HeroSection({ user }) {
  const navigate = useNavigate();

  return (
    <section className="max-w-6xl mx-auto text-center px-6 pt-20 pb-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-200 dark:border-indigo-800/50 shadow-xs">
        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
        <span>The Ultimate Quizzing Platform</span>
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold leading-tight font-vend tracking-tight">
        Host Interactive Quizzes <br />
        <span className="bg-linear-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          In Real-Time
        </span>
      </h1>

      <p
        className="
                mt-6 text-lg md:text-xl 
                text-slate-600 dark:text-slate-300 
                max-w-2xl mx-auto leading-relaxed
            "
      >
        Create, host, and participate in engaging quizzes. Challenge your
        friends or students with live leaderboards and dynamic question formats.
      </p>

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <button
          className="
                        bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700
                        px-7 py-3.5 rounded-2xl 
                        text-white font-bold text-base
                        shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                        transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2
                    "
          onClick={() => navigate(user ? "/generate" : "/auth")}
        >
          <span>{user ? "Create a Quiz" : "Start For Free"}</span>
          <ArrowRight size={18} />
        </button>

        <button
          className="
                        bg-white dark:bg-slate-800 
                        border border-slate-300 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-500
                        px-7 py-3.5 rounded-2xl 
                        text-slate-700 dark:text-slate-200
                        font-bold text-base shadow-xs transition-all flex items-center gap-2
                    "
          onClick={() => navigate("/attempt")}
        >
          <Play size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span>Join Live Quiz</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-14 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs">
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-vend">
            Multiplayer
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Host Live Sessions
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs">
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-vend">
            Real-Time
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live Leaderboard Standings
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs">
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-vend">
            Fair Play
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strict Time Limits
          </p>
        </div>
      </div>
    </section>
  );
}
