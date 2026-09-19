const DifficultyCapsule = ({ difficulty }) => {
  const getStyles = () => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "Hard":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full 
                inline-flex items-center ${getStyles()}`}
    >
      {difficulty}
    </span>
  );
};

export default DifficultyCapsule;
