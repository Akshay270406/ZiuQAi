const GeneralChip = ({ label, count }) => {
  return (
    <div
      className="
                px-4 py-2 rounded-xl 
                bg-white dark:bg-slate-800 
                shadow-sm border 
                border-slate-200 dark:border-slate-700
                text-sm font-medium
            "
    >
      <span className="text-slate-600 dark:text-slate-300">{label}:</span>
      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
        {count}
      </span>
    </div>
  );
};

export default GeneralChip;
