import google from "../../assets/google.png";
import { toast } from "react-toastify";

export default function Others() {
  return (
    <button
      className="
                w-full flex items-center justify-center gap-3 
                bg-white dark:bg-slate-700
                border border-slate-300 dark:border-slate-600
                text-slate-700 dark:text-slate-200
                py-3 rounded-xl 
                hover:bg-slate-100 dark:hover:bg-slate-600 
                transition
            "
      onClick={() => toast.info("Google Sign-In Coming Soon!")}
    >
      <img src={google} alt="Google" className="w-5 h-5" />
      Continue with Google
    </button>
  );
}
