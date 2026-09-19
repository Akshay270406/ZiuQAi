import { Check } from "lucide-react";

const defaultQuestion = {
  question: "Default Question Text?",
  type: "tof",
  options: ["True", "False"],
};

export default function Question({ question, selectedAnswer, onAnswerChange }) {
  const safeQuestion = question || defaultQuestion;
  const { question: text, type, question_type, options } = safeQuestion;
  const qType = type || question_type || "scq";

  // TODO: Make the LLM prompt stricter so options always come back as plain strings,
  // then remove this object-to-string normalization fallback.
  const finalOptions =
    qType === "tof" && (!options || options.length === 0)
      ? ["True", "False"]
      : (options || []).map((opt) => {
          if (typeof opt === "object" && opt !== null) {
            return String(
              opt.text || opt.value || opt.label || JSON.stringify(opt),
            );
          }
          return String(opt);
        });

  const getSelectedArray = () => {
    if (typeof selectedAnswer === "string") {
      return selectedAnswer
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.map((item) => String(item).trim()).filter(Boolean);
    }
    return [];
  };

  const handleFibChange = (e) => {
    if (onAnswerChange) {
      onAnswerChange(e.target.value);
    }
  };

  const handleOptionSelect = (option) => {
    if (!onAnswerChange) return;

    const optStr = String(option);
    if (qType === "mcq") {
      const currentSelected = getSelectedArray();
      let updated;
      if (currentSelected.includes(optStr)) {
        updated = currentSelected.filter((item) => item !== optStr);
      } else {
        updated = [...currentSelected, optStr];
      }
      onAnswerChange(updated.join(", "));
    } else {
      onAnswerChange(optStr);
    }
  };

  const typeLabels = {
    mcq: "Multiple Choice (Select all that apply)",
    scq: "Single Choice",
    tof: "True / False",
    fib: "Fill in the Blank",
  };

  const selectedList = getSelectedArray();

  return (
    <div>
      <div className="mb-3">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
          {typeLabels[qType] || qType.toUpperCase()}
        </span>
      </div>
      <p className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">
        {text}
      </p>

      {qType === "fib" ? (
        <div className="mt-6">
          <input
            type="text"
            placeholder="Enter your answer"
            value={selectedAnswer ?? ""}
            onChange={handleFibChange}
            className="
                            w-full px-4 py-3 rounded-xl 
                            bg-white dark:bg-slate-800
                            border border-slate-300 dark:border-slate-700
                            focus:ring-2 focus:ring-violet-600 
                            outline-none text-slate-800 dark:text-slate-100
                        "
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {finalOptions.map((option, index) => {
            const optStr = String(option);
            const isSelected =
              qType === "mcq"
                ? selectedList.includes(optStr)
                : selectedAnswer != null && String(selectedAnswer) === optStr;

            return (
              <div
                key={`${option}-${index}`}
                onClick={() => handleOptionSelect(option)}
                className={`
                                    w-full p-4 rounded-xl cursor-pointer
                                    bg-white dark:bg-slate-800 border transition shadow-sm
                                    flex gap-3 items-center select-none
                                    ${
                                      isSelected
                                        ? "border-violet-600 bg-violet-50/50 dark:bg-violet-950/20"
                                        : "border-slate-300 dark:border-slate-700 hover:border-violet-600/50"
                                    }
                                `}
              >
                <div
                  className={`
                                    w-5 h-5 border flex items-center justify-center transition-all
                                    ${qType === "mcq" ? "rounded-md" : "rounded-full"}
                                    ${
                                      isSelected
                                        ? "bg-violet-600 border-violet-600 text-white"
                                        : "border-slate-300 dark:border-slate-600"
                                    }
                                `}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
                <span className="text-lg text-slate-700 dark:text-slate-200">
                  {option}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
