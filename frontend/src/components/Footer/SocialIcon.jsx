/*
    Reusable Social Icon
    Props:
        icon: React Component {lucide-react icon}
*/

const SocialIcon = ({ icon }) => (
  <button
    className="
            w-10 h-10 rounded-full 
            flex items-center justify-center 
            border border-slate-300 dark:border-slate-700
            hover:bg-slate-200 dark:hover:bg-slate-700
            transition-all
        "
  >
    {icon}
  </button>
);

export default SocialIcon;
