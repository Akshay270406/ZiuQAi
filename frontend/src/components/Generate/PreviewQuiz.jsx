import Question from "../Arena/Question";
import { Sparkles } from "lucide-react";

export default function PreviewQuiz({
  quizId,
  questions = [],
  onGenerate,
  generating,
}) {
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 dark:text-slate-400 font-semibold">
          AI is analyzing your resources and crafting questions...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Generate Questions with AI
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
          Click the button below to parse your uploaded resources and
          automatically generate questions.
        </p>
        <button
          onClick={onGenerate}
          className="
                        px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl
                        hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none
                        flex items-center gap-2
                    "
        >
          <Sparkles size={18} />
          Generate Questions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Questions Preview
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review the AI-generated questions before publishing
          </p>
        </div>
        <button
          onClick={onGenerate}
          className="
                        px-4 py-2 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg
                        hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition
                        flex items-center gap-2 text-sm
                    "
        >
          <Sparkles size={14} />
          Regenerate
        </button>
      </div>

      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
        {questions.map((q, idx) => (
          <div
            key={q.id || idx}
            className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50"
          >
            <div className="flex justify-between items-start gap-4 mb-4">
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                Question {idx + 1} — {q.question_type}
              </span>
            </div>
            <Question
              question={{
                question: q.question,
                type: q.question_type,
                options: q.options,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
