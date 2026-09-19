import { Link } from "react-router";

const RouteChip = ({ icon, label, description, route }) => {
  return (
    <Link
      to={route}
      className="
                block p-6 rounded-2xl 
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700
                shadow-sm hover:shadow-md transition
                cursor-pointer
            "
    >
      <div className="text-3xl">{icon}</div>
      <p className="font-semibold mt-3 text-lg text-slate-900 dark:text-white">
        {label}
      </p>
      <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
        {description}
      </p>
    </Link>
  );
};

export default RouteChip;
