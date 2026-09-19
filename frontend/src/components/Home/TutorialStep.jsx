import React from "react";

export default function TutorialStep({ step, icon, text, description }) {
  return (
    <div
      className="
            relative flex flex-col items-center text-center 
            bg-white dark:bg-slate-800 
            p-8 rounded-3xl 
            shadow-sm border border-slate-200 dark:border-slate-700
            hover:border-indigo-500/50 transition-all duration-300 group
        "
    >
      <span className="absolute top-4 right-6 text-xs font-mono font-bold text-slate-300 dark:text-slate-600">
        {step}
      </span>

      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 group-hover:scale-110 transition-transform">
        {icon}
      </div>

      <p className="text-xl font-bold font-vend mt-5">{text}</p>

      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
