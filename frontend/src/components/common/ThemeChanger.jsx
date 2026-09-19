import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeProvider";

const ThemeChanger = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
                w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-300 ease-in-out
                ${
                  theme === "light"
                    ? "bg-slate-100 border-slate-700 border-2"
                    : "bg-slate-800 border-slate-300 border-2"
                }
                hover:scale-105
            `}
    >
      {theme === "light" ? (
        <Sun className="w-6 h-6 text-yellow-500" />
      ) : (
        <Moon className="w-6 h-6 text-blue-300" />
      )}
    </button>
  );
};

export default ThemeChanger;
