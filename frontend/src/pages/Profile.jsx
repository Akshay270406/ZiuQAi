import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { authApi } from "../api/authApi";
import { quizApi } from "../api/quizApi";
import { toast } from "react-toastify";
import {
  User as UserIcon,
  Mail,
  Hash,
  Calendar,
  LogOut,
  Award,
  HelpCircle,
  FileText,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";

export default function Profile() {
  const { setEmail, setName, user } = useAuth();
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalQuestions: 0,
    totalDrafts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [meRes, quizzesRes, draftsRes] = await Promise.allSettled([
          authApi.getMe(),
          quizApi.getMyQuizzes(),
          quizApi.getMyDrafts(),
        ]);

        if (meRes.status === "fulfilled") {
          setUserInfo(meRes.value.data);
        }

        let qCount = 0;
        let quesCount = 0;
        if (quizzesRes.status === "fulfilled") {
          const qList = quizzesRes.value.data || [];
          qCount = qList.length;
          quesCount = qList.reduce(
            (acc, curr) => acc + (curr.question_count || 0),
            0,
          );
        }

        let dCount = 0;
        if (draftsRes.status === "fulfilled") {
          dCount = (draftsRes.value.data || []).length;
        }

        setStats({
          totalQuizzes: qCount,
          totalQuestions: quesCount,
          totalDrafts: dCount,
        });
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleCopyCode = () => {
    if (!userInfo?.user_code) return;
    navigator.clipboard.writeText(userInfo.user_code);
    setCopied(true);
    toast.success("User code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    try {
      setEmail(null);
      setName(null);
      const response = await authApi.logout();
      toast.success(response.data.message || "Logout successful");
      navigate("/auth", { state: { isLogin: true } });
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayName = userInfo?.username || user?.username || "User Profile";
  const displayEmail = userInfo?.email || user?.email || "N/A";
  const displayCode = userInfo?.user_code || "N/A";

  return (
    <div
      className="
            min-h-screen pt-28 pb-16 px-6 
            bg-slate-50 dark:bg-slate-900 
            text-slate-800 dark:text-slate-100
            font-roboto
        "
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header Banner */}
        <div
          className="
                    relative overflow-hidden rounded-3xl bg-linear-to-r from-violet-600 to-indigo-600 p-8 md:p-10 text-white shadow-xl
                "
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div
              className="
                            w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40
                            flex items-center justify-center text-4xl font-extrabold uppercase shadow-inner
                        "
            >
              {displayName.charAt(0)}
            </div>

            <div className="space-y-2 flex-1">
              <h1 className="text-3xl md:text-4xl font-bold font-vend">
                {displayName}
              </h1>
              <p className="text-violet-100 text-sm flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} />
                {displayEmail}
              </p>
              <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
                <div
                  className="
                                    inline-flex items-center gap-2 px-3 py-1.5 rounded-xl
                                    bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-mono
                                "
                >
                  <Hash size={14} />
                  <span>Code: {displayCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="hover:text-violet-200 transition ml-1"
                    title="Copy User Code"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="
                        bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm
                        flex items-center gap-4
                    "
          >
            <div className="p-3.5 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <Award size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalQuizzes}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quizzes Hosted
              </p>
            </div>
          </div>

          <div
            className="
                        bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm
                        flex items-center gap-4
                    "
          >
            <div className="p-3.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <HelpCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalQuestions}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Questions Generated
              </p>
            </div>
          </div>

          <div
            className="
                        bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm
                        flex items-center gap-4
                    "
          >
            <div className="p-3.5 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalDrafts}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active Drafts
              </p>
            </div>
          </div>
        </div>

        {/* Account Details & Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shortcuts Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold font-vend">Quick Actions</h3>

            <div className="space-y-2">
              <button
                onClick={() => navigate("/host")}
                className="
                                    w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-600
                                    flex items-center justify-between transition group text-left
                                "
              >
                <span className="font-semibold text-sm">
                  Go to Host Dashboard
                </span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform text-violet-600"
                />
              </button>

              <button
                onClick={() => navigate("/generate")}
                className="
                                    w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-600
                                    flex items-center justify-between transition group text-left
                                "
              >
                <span className="font-semibold text-sm">
                  Create New AI Quiz
                </span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform text-violet-600"
                />
              </button>

              <button
                onClick={() => navigate("/attempt")}
                className="
                                    w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-600
                                    flex items-center justify-between transition group text-left
                                "
              >
                <span className="font-semibold text-sm">Attempt a Quiz</span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform text-violet-600"
                />
              </button>
            </div>
          </div>

          {/* Account Settings & Logout */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-lg font-bold font-vend mb-3">
                Account Security
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are signed in securely to ZiuQ.AI. Your session cookie is
                protected with HTTP-only credentials.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="
                                w-full py-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30
                                hover:bg-red-100 dark:hover:bg-red-900/40 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs
                            "
            >
              <LogOut size={18} />
              Log Out of Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
