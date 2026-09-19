import icon from "../../assets/image.svg";
import DifficultyChip from "./DifficultyCapsule.jsx";

const ActivityChip = ({ quizName, date, score, percentage, difficulty }) => {
  return (
    <div
      className="
            p-5 rounded-2xl 
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            shadow-sm hover:shadow-md
            transition cursor-pointer
        "
    >
      <div className="flex items-center justify-between">
        <img src={icon} alt="icon" className="w-10 h-10" />

        <div className="mt-3">
          <DifficultyChip difficulty={difficulty} />
        </div>
      </div>

      <p className="font-semibold text-lg mt-3 text-slate-900 dark:text-white">
        {quizName}
      </p>

      <p className="text-slate-600 dark:text-slate-400 text-sm">
        Score: {score}/{Math.round((score / percentage) * 100)}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{date}</p>
    </div>
  );
};

export default ActivityChip;
