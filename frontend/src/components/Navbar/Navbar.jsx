import Logo from "../common/Logo";
import ThemeChanger from "../common/ThemeChanger";
import profile from "../../assets/profile.png";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage =
    location.pathname === "/" || location.pathname === "/auth";
  const [isLogin, setIsLogin] = useState(true);

  const handleClick = () => {
    if (!isLogin) {
      navigate("/");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <nav
      className="
                fixed top-4 left-1/2 -translate-x-1/2 
                w-[92%] md:w-[80%] 
                backdrop-blur-xl 
                bg-white/70 dark:bg-slate-900 
                border border-slate-300/40 dark:border-slate-700/40
                shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                rounded-2xl 
                px-6 py-3 
                flex items-center justify-between 
                z-50
            "
    >
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => handleClick()}
      >
        <Logo text="ZiuQ.AI" textSize="text-4xl" iconSize="w-12 h-12" />
      </div>

      <>
        {isLandingPage && (
          <>
            <div className="flex-1"></div>
            <div className="hidden md:flex justify-end items-center gap-4 mx-4">
              <NavLink text="Get Started" route="auth" isAuth={true} />
            </div>
          </>
        )}
      </>

      <div className="flex items-center gap-3">
        <ThemeChanger />
        {isLogin && (
          <Link to="/profile">
            <img
              src={profile}
              alt="Profile"
              className="w-10 h-10 rounded-full cursor-pointer overflow-hidden"
            />
          </Link>
        )}
      </div>
    </nav>
  );
}

const NavLink = ({ text, route, isAuth = true }) => {
  const { pathname } = useLocation();
  const fullRoute = route.startsWith("/") ? route : `/${route}`;
  const isActive = pathname === fullRoute;

  return (
    <Link
      to={fullRoute}
      className={`
                px-4 py-2 
                text-md font-bold 
                rounded-full 
                transition-all duration-300 
                select-none
                ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-300/40 dark:hover:bg-slate-700/50"
                }
                ${isAuth ? "bg-black text-white dark:text-slate-900 dark:bg-white shadow-sm hover:bg-black dark:hover:bg-white/80" : ""}
                font-vend
                font-bold
            `}
    >
      {text}
    </Link>
  );
};
