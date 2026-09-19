import { Squirrel } from "lucide-react";

const Logo = ({ text, textSize = "text-5xl", iconSize = "w-12 h-12" }) => {
  return (
    <div className="flex flex-row items-center gap-x-3">
      <Squirrel className={`${iconSize} text-black dark:text-white`} />
      <p className={`font-jockey ${textSize} text-black dark:text-white`}>
        {text}
      </p>
    </div>
  );
};

export default Logo;
