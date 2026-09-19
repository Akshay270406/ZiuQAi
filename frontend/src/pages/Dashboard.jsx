import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { Play, Plus, Radio, ArrowRight, ChevronRight } from "lucide-react";
import { quizApi } from "../api/quizApi";
import { ROUTES } from "../constants/routes";

export default function Dashboard() {
  const { name } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [hostedQuizzes, setHostedQuizzes] = useState([]);
  const [stats, setStats] = useState({
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [draftsRes, statsRes, hostedRes] = await Promise.all([
          quizApi.getMyDrafts(),
          quizApi.getDashboardStats(),
          quizApi.getMyQuizzes(),
        ]);
        setDrafts(draftsRes.data || []);
        setHostedQuizzes(hostedRes.data || []);
        setStats(statsRes.data || { recentActivity: [] });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 md:px-12 bg-[#F8F9FA] dark:bg-slate-900 font-sans relative">
      {/* Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-full h-80 bg-linear-to-b from-indigo-500/10 via-purple-500/5 to-transparent -z-10 rounded-b-[100px]"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-40 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight font-vend">
            Welcome, {name}!
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2 font-medium">
            What are we doing today?
          </p>
        </header>

        {/* Primary Action Buttons (Top Row) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <button
            onClick={() => navigate("/generate")}
            className="w-full group relative h-36 bg-indigo-600 hover:bg-indigo-500 rounded-3xl p-6 text-left transition-all duration-300 shadow-[0_8px_0_0_#3730a3] hover:shadow-[0_4px_0_0_#3730a3] hover:translate-y-1 overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                <Plus size={26} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-vend">
                  Create
                </h3>
                <p className="text-indigo-200 font-medium text-sm mt-0.5">
                  Generate a new quiz
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/host")}
            className="w-full group relative h-36 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-3xl p-6 text-left transition-all duration-300 shadow-[0_8px_0_0_#86198f] hover:shadow-[0_4px_0_0_#86198f] hover:translate-y-1 overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                <Radio size={26} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-vend">
                  Host
                </h3>
                <p className="text-fuchsia-200 font-medium text-sm mt-0.5">
                  Start a live session
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/attempt")}
            className="w-full group relative h-36 bg-emerald-500 hover:bg-emerald-400 rounded-3xl p-6 text-left transition-all duration-300 shadow-[0_8px_0_0_#047857] hover:shadow-[0_4px_0_0_#047857] hover:translate-y-1 overflow-hidden"
          >
            <div className="absolute -left-4 -top-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md pl-0.5">
                <Play size={26} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-vend">
                  Attempt
                </h3>
                <p className="text-emerald-100 font-medium text-sm mt-0.5">
                  Attempt live quizzes
                </p>
              </div>
            </div>
          </button>
        </section>

        {/* 3 Aligned Equal-Height Column Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Box 1: DRAFTS */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-md flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white font-vend">
                Your Drafts
              </h2>

              {drafts.length > 0 ? (
                <div className="space-y-3">
                  {drafts.slice(0, 3).map((draft) => (
                    <div
                      key={draft.quiz_id}
                      onClick={() =>
                        navigate(`/generate?draft=${draft.quiz_id}`)
                      }
                      className="group cursor-pointer flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/60 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
                    >
                      <div className="flex items-center gap-3.5 truncate">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {draft.question_count}Q
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                            {draft.quiz_name}
                          </h3>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                            {draft.quiz_difficulty.toLowerCase()} level
                          </p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-amber-100/60 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 text-center border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                    No drafts in progress.
                  </p>
                  <button
                    onClick={() => navigate("/generate")}
                    className="mt-2 text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    Create new <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {drafts.length > 3 && (
              <button
                onClick={() => navigate("/generate")}
                className="w-full py-2.5 px-4 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40 transition flex items-center justify-center gap-1 mt-auto"
              >
                Show More Drafts ({drafts.length - 3}){" "}
                <ChevronRight size={14} />
              </button>
            )}
          </section>

          {/* Box 2: HOSTED QUIZZES */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-md flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white font-vend">
                Hosted Quizzes
              </h2>

              {hostedQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {hostedQuizzes.slice(0, 3).map((quiz) => (
                    <div
                      key={quiz.id}
                      onClick={() => navigate("/host")}
                      className="group cursor-pointer flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/60 dark:border-slate-600 hover:border-fuchsia-400 dark:hover:border-fuchsia-500 transition-all"
                    >
                      <div className="flex items-center gap-3.5 truncate">
                        <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {quiz.question_count}Q
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                            {quiz.quiz_name}
                          </h3>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${quiz.status === "published" ? "bg-emerald-500" : "bg-slate-400"}`}
                            ></span>
                            {quiz.status === "published" ? "Live" : "Closed"}
                          </p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-fuchsia-100/60 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-300 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 text-center border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                    You don't have any hosted quizzes.
                  </p>
                  <button
                    onClick={() => navigate("/host")}
                    className="mt-2 text-fuchsia-600 dark:text-fuchsia-400 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    Host now <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {hostedQuizzes.length > 3 && (
              <button
                onClick={() => navigate("/host")}
                className="w-full py-2.5 px-4 text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 rounded-xl border border-fuchsia-200/60 dark:border-fuchsia-800/40 transition flex items-center justify-center gap-1 mt-auto"
              >
                Show More Hosted ({hostedQuizzes.length - 3}){" "}
                <ChevronRight size={14} />
              </button>
            )}
          </section>

          {/* Box 3: RECENT ATTEMPTS */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-md flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white font-vend">
                Recent Attempts
              </h2>

              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 3).map((activity, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate("/attempt")}
                      className="group cursor-pointer flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/60 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all"
                    >
                      <div className="flex items-center gap-3.5 truncate">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {activity.score}/{activity.total ?? 10}
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                            {activity.quizName}
                          </h3>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-5 text-center border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                    You don't have any attempted quizzes.
                  </p>
                  <button
                    onClick={() => navigate("/attempt")}
                    className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    Attempt now <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {stats.recentActivity && stats.recentActivity.length > 3 && (
              <button
                onClick={() => navigate("/attempt")}
                className="w-full py-2.5 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 transition flex items-center justify-center gap-1 mt-auto"
              >
                Show More Attempts ({stats.recentActivity.length - 3}){" "}
                <ChevronRight size={14} />
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
