import React from "react";
import { Award } from "lucide-react";

export default function EmptyQuizState({ onCreateQuiz }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
      <Award className="w-16 h-16 mx-auto text-slate-400 mb-4" />
      <h3 className="text-xl font-bold mb-2">No quizzes created yet</h3>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto">
        Create your first quiz to start hosting interactive sessions.
      </p>
      <button
        onClick={onCreateQuiz}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
      >
        Get Started
      </button>
    </div>
  );
}
