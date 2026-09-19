import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Search,
  Calendar,
  Clock,
  Award,
  Play,
  CheckCircle2,
} from "lucide-react";
import { quizApi } from "../api/quizApi";

export default function Attempt() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quizId, setQuizId] = useState("");
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [timeLeftToStart, setTimeLeftToStart] = useState(0);

  useEffect(() => {
    const idFromUrl = searchParams.get("quiz_id");
    if (idFromUrl) {
      setQuizId(idFromUrl);
      fetchQuizDetails(idFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const isRegistered = quizDetails?.is_registered ?? quizDetails?.registered;
    if (!quizDetails || !isRegistered) return;

    const startTime = new Date(quizDetails.quiz_start_time).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.floor((startTime - now) / 1000);
      if (diff <= 0) {
        setTimeLeftToStart(0);
        clearInterval(interval);
      } else {
        setTimeLeftToStart(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizDetails]);

  const fetchQuizDetails = async (idToFetch) => {
    const targetId = idToFetch || quizId;
    if (!targetId) return;

    setLoading(true);
    setQuizDetails(null);
    try {
      const res = await quizApi.getQuizDetails(targetId);
      setQuizDetails(res.data);

      const startTime = new Date(res.data.quiz_start_time).getTime();
      const now = new Date().getTime();
      setTimeLeftToStart(Math.max(0, Math.floor((startTime - now) / 1000)));
    } catch (err) {
      console.error(err);
      toast.error("Quiz not found or not published yet.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!quizDetails) return;
    setRegistering(true);
    try {
      await quizApi.registerForQuiz(quizDetails.id);
      toast.success("Registered for quiz successfully!");
      fetchQuizDetails(quizDetails.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to register for quiz");
    } finally {
      setRegistering(false);
    }
  };

  const formatCountdown = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="
            min-h-screen pt-30 pb-12 px-6 
            bg-slate-50 dark:bg-slate-900 
            text-slate-800 dark:text-slate-200
            font-roboto
         font-vend"
    >
      <div className="max-w-xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-black dark:text-white mb-3">
            Attempt a Quiz
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Enter the Quiz ID to register and attempt the quiz.
          </p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Quiz ID (e.g. 1)"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchQuizDetails()}
              className="
                                flex-1 p-3 rounded-xl 
                                bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                                text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none
                            "
            />
            <button
              onClick={() => fetchQuizDetails()}
              disabled={loading || !quizId}
              className="
                                px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition
                                disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2
                            "
            >
              <Search size={18} />
              Find
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {quizDetails && (
            <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-2xl font-bold font-vend text-slate-900 dark:text-white">
                  {quizDetails.quiz_name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                  Quiz Status: {quizDetails.status}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-xs text-slate-500 block mb-1">
                    Start Time
                  </span>
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    {new Date(
                      quizDetails.quiz_start_time,
                    ).toLocaleDateString()}{" "}
                    {new Date(quizDetails.quiz_start_time).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-xs text-slate-500 block mb-1">
                    Duration
                  </span>
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-600" />
                    {quizDetails.quiz_duration} Minutes
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-xs text-slate-500 block mb-1">
                    Questions
                  </span>
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-600" />
                    {quizDetails.question_count} MCQs
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-xs text-slate-500 block mb-1">
                    Difficulty
                  </span>
                  <span className="text-sm font-bold flex items-center gap-1.5 capitalize">
                    <Award size={14} className="text-indigo-600" />
                    {quizDetails.quiz_difficulty.toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                {(() => {
                  const isRegistered =
                    quizDetails.is_registered ?? quizDetails.registered;
                  const isSubmitted =
                    quizDetails.is_submitted ?? quizDetails.submitted;
                  const now = Date.now();
                  const startMs = new Date(
                    quizDetails.quiz_start_time,
                  ).getTime();
                  const endMs =
                    startMs + (quizDetails.quiz_duration || 0) * 60 * 1000;
                  const hasStarted = now >= startMs;
                  const hasEnded = now > endMs;

                  if (!isRegistered) {
                    if (hasStarted) {
                      return (
                        <div className="text-center space-y-2">
                          <button
                            disabled
                            className="w-full py-3.5 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded-2xl cursor-not-allowed"
                          >
                            Registration Closed
                          </button>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Registration closed as the quiz has already started.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="
                                                    w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg
                                                    shadow-indigo-200 dark:shadow-none transition-all duration-300 disabled:opacity-50
                                                "
                      >
                        {registering ? "Registering..." : "Register for Quiz"}
                      </button>
                    );
                  }

                  if (isSubmitted) {
                    return (
                      <div className="text-center space-y-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-200/50 flex flex-col items-center">
                          <span className="text-xs font-semibold uppercase tracking-wider mb-1">
                            Status
                          </span>
                          <span className="text-xl font-extrabold font-vend flex items-center gap-2">
                            <CheckCircle2 size={20} />
                            Attempt Submitted
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            You have already completed this quiz attempt.
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(`/standings/${quizDetails.id}`)
                          }
                          className="
                                                        w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg
                                                        shadow-indigo-200 dark:shadow-none transition-all duration-300 flex items-center justify-center gap-2
                                                    "
                        >
                          View Standings / Leaderboard
                        </button>
                      </div>
                    );
                  }

                  if (!hasStarted) {
                    return (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-200/50 flex flex-col items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider mb-1">
                          Starts In
                        </span>
                        <span className="text-3xl font-extrabold font-mono">
                          {formatCountdown(timeLeftToStart)}
                        </span>
                      </div>
                    );
                  }

                  if (hasEnded) {
                    return (
                      <div className="text-center space-y-2">
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-200/50 flex flex-col items-center">
                          <span className="text-xs font-semibold uppercase tracking-wider mb-1">
                            Status
                          </span>
                          <span className="text-xl font-extrabold font-vend">
                            Quiz Window Expired
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            The quiz time window for this attempt has ended.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => navigate(`/arena/${quizDetails.id}`)}
                      className="
                                                w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg
                                                shadow-green-200 dark:shadow-none transition-all duration-300 flex items-center justify-center gap-2
                                            "
                    >
                      <Play size={18} />
                      Start Attempt
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
