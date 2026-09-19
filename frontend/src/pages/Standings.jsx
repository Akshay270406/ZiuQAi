import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Medal,
  Lock,
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
import { quizApi } from "../api/quizApi";

export default function Standings() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [standings, setStandings] = useState([]);
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const numericQuizId = parseInt(quizId, 10);

  const fetchLeaderboard = async () => {
    if (isNaN(numericQuizId)) {
      setLoading(false);
      toast.error("Invalid Quiz ID");
      return;
    }
    setLoading(true);
    setLocked(false);
    try {
      const [lbRes, qRes] = await Promise.allSettled([
        quizApi.getLeaderboard(numericQuizId),
        quizApi.getQuizDetails(numericQuizId),
      ]);

      if (qRes.status === "fulfilled") {
        setQuizDetails(qRes.value.data);
      }

      if (lbRes.status === "fulfilled") {
        setStandings(lbRes.value.data.leaderboard || []);
      } else {
        const err = lbRes.reason;
        if (err.response && err.response.status === 403) {
          setLocked(true);
          setLockMessage(
            err.response.data.detail ||
              "Leaderboard is locked until the quiz has ended.",
          );
        } else {
          console.error("Failed to load leaderboard", err);
          toast.error("Failed to load standings data");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while loading standings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [quizId]);

  const handleToggleVisibility = async () => {
    if (!quizDetails || isNaN(numericQuizId)) return;
    const newShow = !quizDetails.show_leaderboard;
    try {
      await quizApi.updateQuiz({
        quiz_id: numericQuizId,
        show_leaderboard: newShow,
      });
      setQuizDetails({ ...quizDetails, show_leaderboard: newShow });
      toast.success(
        `Participant leaderboard visibility set to ${newShow ? "Visible" : "Host Only"}`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update visibility");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      className="
            pt-30 min-h-screen px-6 pb-12
            bg-slate-50 dark:bg-slate-900 
            text-slate-800 dark:text-slate-100
            transition-colors duration-300
        "
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() =>
            navigate(quizDetails?.is_owner ? "/host" : "/dashboard")
          }
          className="
                        mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition
                    "
        >
          <ArrowLeft size={16} />
          {quizDetails?.is_owner
            ? "Back to Host Dashboard"
            : "Back to Dashboard"}
        </button>

        {quizDetails?.is_owner && (
          <div
            className="
                        mb-8 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800
                        flex flex-col md:flex-row items-center justify-between gap-4
                    "
          >
            <div className="flex items-center gap-3">
              <Shield
                className="text-indigo-600 dark:text-indigo-400"
                size={24}
              />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  Host Control View
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  As the quiz owner, you can view standings anytime.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleVisibility}
              className="
                                px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm
                                bg-indigo-600 hover:bg-indigo-700 text-white
                            "
            >
              {quizDetails.show_leaderboard ? (
                <Eye size={16} />
              ) : (
                <EyeOff size={16} />
              )}
              Participant Visibility:{" "}
              {quizDetails.show_leaderboard
                ? "Enabled (Visible)"
                : "Disabled (Host Only)"}
            </button>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold flex justify-center items-center gap-3 font-vend">
            Standings
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            See who's topping the charts in this quiz.
          </p>
        </div>

        {locked ? (
          <div
            className="
                        bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm
                        flex flex-col items-center justify-center gap-4 max-w-lg mx-auto
                    "
          >
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl flex items-center justify-center">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold">Leaderboard Locked</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {lockMessage}
            </p>
            <button
              onClick={fetchLeaderboard}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
            >
              Refresh Standings
            </button>
          </div>
        ) : standings.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">
              No responses submitted yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {standings.map((student, idx) => (
              <StandingItem
                key={student.rank ?? student.user_id ?? idx}
                totalMarks={quizDetails?.question_count}
                {...student}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const StandingItem = (props) => {
  const position = props.rank ?? props.position;
  const name = props.username ?? props.name ?? "Anonymous";
  const marksObtained = props.score ?? props.marksObtained ?? 0;
  const totalMarks =
    props.totalMarks ??
    props.total ??
    props.total_questions ??
    props.question_count ??
    10;
  let rankIcon = (
    <span className="text-xl font-bold w-8 text-center">{position}</span>
  );
  let rankStyles =
    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";

  if (position === 1) {
    rankIcon = (
      <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500/20" />
    );
    rankStyles =
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50";
  } else if (position === 2) {
    rankIcon = <Medal className="w-8 h-8 text-slate-400 fill-slate-400/20" />;
    rankStyles =
      "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600";
  } else if (position === 3) {
    rankIcon = <Medal className="w-8 h-8 text-amber-600 fill-amber-600/20" />;
    rankStyles =
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50";
  }

  return (
    <div
      className={`
            flex items-center justify-between gap-4 p-4 md:p-6
            rounded-2xl border shadow-sm
            transition-all hover:scale-[1.01]
            ${rankStyles}
        `}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 flex justify-center">{rankIcon}</div>

        <div className="flex items-center gap-3">
          <div
            className="
                        w-10 h-10 rounded-full 
                        bg-linear-to-tr from-violet-500 to-fuchsia-500
                        flex items-center justify-center
                        text-white font-bold text-lg
                    "
          >
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h3 className="text-lg font-bold">{name}</h3>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 text-right">
        <div className="text-xl font-bold">
          {marksObtained}
          <span className="text-slate-400 text-sm font-normal">
            /{totalMarks}
          </span>
        </div>
      </div>
    </div>
  );
};
