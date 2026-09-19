import React from "react";
import { useNavigate } from "react-router-dom";

export default function CtaSection({ user }) {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-linear-to-b from-slate-100 to-slate-200 dark:from-slate-800/60 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800 text-center px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl md:text-4xl font-extrabold font-vend">
          Ready to Host Your Next Quiz?
        </h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Join users who are building engaging, interactive experiences in
          seconds.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <button
            className="
                            bg-indigo-600 hover:bg-indigo-700 
                            px-8 py-4 rounded-2xl 
                            text-white font-bold text-base
                            shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5
                        "
            onClick={() => navigate(user ? "/generate" : "/auth")}
          >
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
}
