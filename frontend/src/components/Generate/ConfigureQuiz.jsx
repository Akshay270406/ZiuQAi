import {
  Settings,
  Clock,
  Hash,
  Layers,
  CheckSquare,
  ListChecks,
  Type,
} from "lucide-react";

export default function ConfigureQuiz({ config, setConfig }) {
  const marks = Array.from({ length: 10 }, (_, i) => 5 + i * 5);

  const QUESTION_TYPES = [
    { label: "Single correct (SCQ)", value: "scq" },
    { label: "Multiple correct (MCQ)", value: "mcq" },
    { label: "True / False (TOF)", value: "tof" },
    { label: "Fill in the Blanks (FIB)", value: "fib" },
  ];

  const toggleQuestionType = (type) => {
    setConfig((prev) => {
      const types = prev.question_types.includes(type)
        ? prev.question_types.filter((t) => t !== type)
        : [...prev.question_types, type];
      return { ...prev, question_types: types };
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Settings size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Quiz Configuration
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customize your quiz parameters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        {/* Quiz Name */}
        <div className="space-y-3 md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Type size={16} /> Quiz Title
          </label>
          <input
            type="text"
            placeholder="E.g., Midterm Machine Learning Quiz"
            value={config.quiz_name}
            onChange={(e) =>
              setConfig({ ...config, quiz_name: e.target.value })
            }
            className="
                            w-full p-3 rounded-xl 
                            bg-slate-50 dark:bg-slate-900 
                            border border-slate-200 dark:border-slate-700
                            text-slate-800 dark:text-slate-200
                            focus:ring-2 focus:ring-indigo-500 outline-none
                        "
          />
        </div>

        {/* Question Count */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Hash size={16} /> Number of Questions ({config.question_count})
          </label>

          <div className="flex flex-col w-full">
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={config.question_count}
              onChange={(e) =>
                setConfig({
                  ...config,
                  question_count: parseInt(e.target.value),
                })
              }
              className="
                                w-full h-2 appearance-none rounded-lg cursor-pointer
                                bg-slate-200 dark:bg-slate-700
                                accent-indigo-600
                            "
            />

            <div className="mt-4 z-10 w-full flex justify-between text-xs text-slate-500 font-medium">
              {marks.map((mark) => (
                <span key={mark}>{mark}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty Settings */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Layers size={16} /> Difficulty Level
          </label>
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50">
            {["EASY", "MEDIUM", "HARD"].map((level) => (
              <button
                key={level}
                className={`
                                    flex-1 py-2 rounded-lg text-sm font-bold transition-all
                                    ${
                                      level === config.quiz_difficulty
                                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }
                                `}
                onClick={() => setConfig({ ...config, quiz_difficulty: level })}
              >
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Time Limit & Start Time */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              <Clock size={16} /> Quiz Duration (Minutes)
            </label>
            <input
              type="number"
              min="1"
              value={config.quiz_duration}
              onChange={(e) =>
                setConfig({
                  ...config,
                  quiz_duration: parseInt(e.target.value) || 0,
                })
              }
              className="
                                w-full p-3 rounded-xl 
                                bg-slate-50 dark:bg-slate-900 
                                border border-slate-200 dark:border-slate-700
                                text-slate-800 dark:text-slate-200
                                focus:ring-2 focus:ring-indigo-500 outline-none
                            "
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              <Clock size={16} /> Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={config.quiz_start_time}
              onChange={(e) =>
                setConfig({ ...config, quiz_start_time: e.target.value })
              }
              className="
                                w-full p-3 rounded-xl 
                                bg-slate-50 dark:bg-slate-900 
                                border border-slate-200 dark:border-slate-700
                                text-slate-800 dark:text-slate-200
                                focus:ring-2 focus:ring-indigo-500 outline-none
                            "
            />
          </div>
        </div>

        {/* Question Types */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <ListChecks size={16} /> Question Types
          </label>

          <div className="grid grid-cols-1 gap-2">
            {QUESTION_TYPES.map(({ label, value }) => (
              <ToggleOption
                key={value}
                label={label}
                active={config.question_types.includes(value)}
                onClick={() => toggleQuestionType(value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Extra Options */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
        <ToggleSwitch
          label="Show Leaderboard"
          desc="Display user rankings after the quiz has ended"
          item={config.show_leaderboard}
          setItem={(val) => setConfig({ ...config, show_leaderboard: val })}
        />
      </div>
    </div>
  );
}

function ToggleOption({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
                flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                }
            `}
    >
      <span className="text-sm font-semibold">{label}</span>

      <div
        className={`
                    w-5 h-5 rounded flex items-center justify-center border
                    ${
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-slate-300 dark:border-slate-600"
                    }
                `}
      >
        {active && <CheckSquare size={14} />}
      </div>
    </div>
  );
}

function ToggleSwitch({ label, desc, item, setItem }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="font-bold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <div
        className={`
                    w-12 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer
                    ${item ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}
                `}
        onClick={() => setItem(!item)}
      >
        <div
          className={`
                        w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300
                        ${item ? "translate-x-6" : "translate-x-0"}
                    `}
        ></div>
      </div>
    </div>
  );
}
