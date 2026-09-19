import React from "react";
import {
  Calendar,
  Clock,
  Award,
  Eye,
  Share2,
  Edit,
  Trash2,
  Settings,
} from "lucide-react";
import { formatDateString } from "../../utils/dateHelper";

export default function QuizCard({
  quiz,
  onNavigate,
  onCopyUrl,
  onToggleLeaderboard,
  onOpenEditModal,
  onDelete,
}) {
  const quizId = quiz.id;
  const isDraft = quiz.status === "draft";
  const registrationUrl = `${window.location.origin}/attempt?quiz_id=${quizId}`;

  const formattedDate = formatDateString(quiz.quiz_start_time);

  return (
    <div
      className="
                bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 shadow-sm
            "
    >
      <div>
        <div className="flex justify-between items-start gap-4 mb-4">
          <h3 className="text-xl font-bold font-vend text-slate-900 dark:text-white line-clamp-1">
            {quiz.quiz_name}
          </h3>
          <span
            className={`
                        px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${
                          isDraft
                            ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                            : "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
                        }
                    `}
          >
            {quiz.status}
          </span>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar size={16} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Clock size={16} />
            <span>
              {quiz.quiz_duration} mins — {quiz.question_count} Questions
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Award size={16} />
            <span className="capitalize">
              {quiz.quiz_difficulty} difficulty
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {!isDraft ? (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={quizId}
                className="
                                    flex-1 p-2 text-center text-sm font-mono font-bold rounded-lg
                                    bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                                    text-slate-600 dark:text-slate-300
                                "
              />
              <button
                onClick={() => onCopyUrl(registrationUrl)}
                className="
                                    p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg text-slate-600 dark:text-slate-300
                                "
                title="Copy share link"
              >
                <Share2 size={18} />
              </button>
            </div>
            <button
              onClick={() => onToggleLeaderboard(quizId, quiz.show_leaderboard)}
              className="
                                w-full py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-between transition
                                bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-violet-500
                            "
            >
              <span className="text-slate-600 dark:text-slate-400">
                Participant Leaderboard:
              </span>
              <span
                className={
                  quiz.show_leaderboard
                    ? "text-green-600 font-bold"
                    : "text-amber-500 font-bold"
                }
              >
                {quiz.show_leaderboard ? "Visible" : "Host Only"}
              </span>
            </button>

            <button
              onClick={() => onNavigate(`/standings/${quizId}`)}
              className="
                                w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl
                                hover:bg-indigo-100/50 transition border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center gap-2
                            "
            >
              <Eye size={16} />
              View Leaderboard
            </button>
            <button
              onClick={() => onOpenEditModal(quiz)}
              className="
                                w-full py-2.5 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 font-bold rounded-xl
                                hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2
                            "
            >
              <Settings size={16} />
              Edit Quiz
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate(`/generate?draft=${quizId}`)}
              className="
                                flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl
                                transition flex items-center justify-center gap-2
                            "
            >
              <Edit size={16} />
              Continue Draft
            </button>
            <button
              onClick={() => onOpenEditModal(quiz)}
              className="
                                flex-1 py-2.5 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 font-bold rounded-xl
                                hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2
                            "
            >
              <Settings size={16} />
              Edit Details
            </button>
            <button
              onClick={() => onDelete(quizId)}
              className="
                                p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100 rounded-xl
                            "
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
