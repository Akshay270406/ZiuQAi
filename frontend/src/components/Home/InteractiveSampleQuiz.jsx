import React, { useState } from "react";
import { RotateCcw, CheckCircle2, XCircle } from "lucide-react";

const SAMPLE_QUESTION = {
  question:
    "What is the primary benefit of using a real-time leaderboard in a quiz?",
  options: [
    "A) It decreases server load.",
    "B) It drives participant engagement and competition.",
    "C) It allows users to cheat.",
    "D) It reduces the number of questions needed.",
  ],
  correctIndex: 1,
  explanation:
    "Correct! Real-time leaderboards significantly boost engagement by adding a competitive edge to the quizzing experience.",
};

export default function InteractiveSampleQuiz() {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);

  const handleOptionSelect = (index) => {
    if (hasSubmittedAnswer) return;
    setSelectedOptionIndex(index);
  };

  const handleAnswerSubmit = () => {
    if (selectedOptionIndex === null) return;
    setHasSubmittedAnswer(true);
  };

  const handleDemoReset = () => {
    setSelectedOptionIndex(null);
    setHasSubmittedAnswer(false);
  };

  const getOptionStyle = (index, isSelected, isCorrect, hasSubmitted) => {
    let baseStyle =
      "border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/30";
    if (isSelected) {
      baseStyle =
        "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-semibold";
    }
    if (hasSubmitted) {
      if (isCorrect) {
        baseStyle =
          "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold";
      } else if (isSelected && !isCorrect) {
        baseStyle =
          "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";
      }
    }
    return baseStyle;
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold font-vend">
          Try an Interactive Sample
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Experience the clean, intuitive quiz interface.
        </p>
      </div>

      <div
        className="
                bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg space-y-6 max-w-2xl mx-auto
            "
      >
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            Sample Question Demo
          </span>
          {hasSubmittedAnswer && (
            <button
              onClick={handleDemoReset}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition"
            >
              <RotateCcw size={14} />
              Reset Demo
            </button>
          )}
        </div>

        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 font-vend">
          {SAMPLE_QUESTION.question}
        </p>

        <div className="space-y-3">
          {SAMPLE_QUESTION.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            const isCorrect = index === SAMPLE_QUESTION.correctIndex;
            const styleString = getOptionStyle(
              index,
              isSelected,
              isCorrect,
              hasSubmittedAnswer,
            );

            return (
              <div
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`
                                    p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${styleString}
                                `}
              >
                <span>{option}</span>
                {hasSubmittedAnswer && isCorrect && (
                  <CheckCircle2
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                )}
                {hasSubmittedAnswer && isSelected && !isCorrect && (
                  <XCircle
                    size={18}
                    className="text-rose-600 dark:text-rose-400"
                  />
                )}
              </div>
            );
          })}
        </div>

        {!hasSubmittedAnswer ? (
          <button
            onClick={handleAnswerSubmit}
            disabled={selectedOptionIndex === null}
            className="
                            w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                            text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2
                        "
          >
            Check Answer
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-xs md:text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
            {SAMPLE_QUESTION.explanation}
          </div>
        )}
      </div>
    </section>
  );
}
