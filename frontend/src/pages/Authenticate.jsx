import { useState, useEffect } from "react";
import AuthForm from "../components/Auth/AuthForm";
import { useAuth } from "../context/AuthProvider";
import Others from "../components/Auth/Others";
import loginArt from "../assets/loginArt.png";
import { Navigate } from "react-router-dom";

export default function AuthenticatePage() {
  const { email } = useAuth();
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    if (isLogin) {
      document.title = "ZiuQ.AI | Login";
    } else {
      document.title = "ZiuQ.AI | Sign Up";
    }
  }, [isLogin]);

  if (email) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 overflow-x-hidden font-jockey">
      <div
        className="hidden md:flex flex-col justify-center items-center 
                relative overflow-hidden
                bg-linear-to-br from-blue-950 via-purple-700 to-blue-900 
                text-center px-10 text-white"
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <img
            src={loginArt}
            alt="Illustration"
            className="w-full max-w-md h-auto drop-shadow-2xl mx-auto hover:scale-105 transition-transform duration-500"
          />

          <h1 className="text-5xl font-extrabold mt-12 mb-4 font-jockey tracking-wide drop-shadow-lg">
            {isLogin ? "Welcome Back!" : "Join the Revolution!"}
          </h1>

          <p className="text-lg text-indigo-100 max-w-lg mx-auto font-roboto leading-relaxed opacity-90">
            {isLogin
              ? "Continue creating immersive AI-powered quizzes. Your audience is waiting!"
              : "Unlock the power of AI to generate mind-blowing quizzes in seconds. Sign up today."}
          </p>
        </div>
      </div>

      <div
        className="flex flex-col justify-center px-6 md:px-20 lg:px-32 
    bg-slate-50 dark:bg-slate-900 
    py-24 md:py-0 md:pt-18 text-lg"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-slate-100 dark:border-slate-700/50">
            <AuthForm isLogin={isLogin} />

            <div className="mt-6 text-center text-slate-600 dark:text-slate-400 text-md">
              {isLogin ? (
                <p>
                  Don't have an account?{" "}
                  <span
                    onClick={() => setIsLogin(false)}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline"
                  >
                    Sign up
                  </span>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <span
                    onClick={() => setIsLogin(true)}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline"
                  >
                    Login
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Or
              </p>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <Others />
          </div>
        </div>
      </div>
    </div>
  );
}
