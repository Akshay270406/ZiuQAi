import React from "react";

export default function FeatureChip({ icon, text, description }) {
  return (
    <div
      className="
            flex items-start gap-4 p-6 
            bg-white dark:bg-slate-800 
            rounded-3xl shadow-sm 
            border border-slate-200 dark:border-slate-700
            hover:border-indigo-500/50 transition-all duration-300 group
        "
    >
      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 group-hover:scale-105 transition-transform">
        {icon}
      </div>

      <div>
        <p className="text-lg font-bold font-vend">{text}</p>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
