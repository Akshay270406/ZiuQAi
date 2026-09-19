/*
    Reusable Footer links
    Props:
        text: string
*/

const FooterLink = ({ text }) => (
  <p
    className="
        text-slate-600 dark:text-slate-400 text-sm 
        hover:text-indigo-600 dark:hover:text-indigo-400 
        cursor-pointer transition-all
    "
  >
    {text}
  </p>
);

export default FooterLink;
