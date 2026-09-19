export default function Navigation({
  questions = [],
  statuses = {},
  currentIndex,
  onSelect,
}) {
  return (
    <div
      className="
            w-full max-w-xs 
            bg-white dark:bg-slate-800 
            border border-slate-200 dark:border-slate-700 
            rounded-2xl p-5 shadow-sm
        "
    >
      <p className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
        Question Navigator
      </p>

      <div className="grid grid-cols-5 gap-3">
        {questions.map((_, index) => {
          let status = statuses[index] || "notVisited";
          // If it is the current question, show current style
          if (index === currentIndex) {
            status = "current";
          }

          return (
            <NavBtn
              key={index}
              questionIdx={index + 1}
              status={status}
              onClick={() => onSelect(index)}
            />
          );
        })}
      </div>

      <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-4">
        <p className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
          Legend
        </p>

        <div className="flex flex-col gap-2 text-xs">
          <LegendItem
            color="bg-red-600 border-red-700"
            label="Current / Not Saved"
          />
          <LegendItem
            color="bg-green-600 border-green-700"
            label="Saved Answer"
          />
          <LegendItem
            color="bg-violet-600 border-violet-700"
            label="Marked for Review"
          />
          <LegendItem
            color="bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            label="Not Visited"
          />
        </div>
      </div>
    </div>
  );
}

const NavBtn = ({ questionIdx, status, onClick }) => {
  const baseStyles = `
        w-10 h-10 flex items-center justify-center 
        rounded-full font-semibold text-sm 
        transition border shadow-sm cursor-pointer
    `;

  const statusStyles = {
    complete: `
            bg-green-600 text-white 
            border-green-700 
            hover:bg-green-700
        `,
    markForReview: `
            bg-violet-600 text-white 
            border-violet-700 
            hover:bg-violet-700
        `,
    notVisited: `
            bg-slate-100 text-slate-600 
            dark:bg-slate-750 dark:text-slate-300
            border-slate-200 dark:border-slate-700
            hover:border-violet-600 hover:text-violet-600
        `,
    current: `
            bg-red-600 text-white 
            border-red-700 
            hover:bg-red-700
        `,
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${statusStyles[status] || statusStyles.notVisited}`}
    >
      {questionIdx}
    </button>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3.5 h-3.5 rounded-full border ${color}`}></div>
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
  </div>
);
