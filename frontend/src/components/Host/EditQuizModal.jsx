import { useState, useEffect } from "react";
import { X, Lock, Info } from "lucide-react";
import { quizApi } from "../../api/quizApi";
import { toast } from "react-toastify";
import Question from "../Arena/Question";

export default function EditQuizModal({
  isOpen,
  onClose,
  quiz,
  onSaveSuccess,
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);

  const [formData, setFormData] = useState({
    quiz_name: "",
    quiz_start_time: "",
    quiz_duration: 15,
    quiz_difficulty: "MEDIUM",
    show_leaderboard: true,
  });

  const fetchQuestions = async () => {
    if (!quiz) return;
    setFetchingQuestions(true);
    try {
      const res = await quizApi.getHostQuizQuestions(quiz.id || quiz.quiz_id);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    } finally {
      setFetchingQuestions(false);
    }
  };

  useEffect(() => {
    if (quiz && isOpen) {
      setFormData({
        quiz_name: quiz.quiz_name || "",
        quiz_start_time: quiz.quiz_start_time
          ? new Date(quiz.quiz_start_time).toISOString().slice(0, 16)
          : "",
        quiz_duration: quiz.quiz_duration || 15,
        quiz_difficulty: quiz.quiz_difficulty || "MEDIUM",
        show_leaderboard: quiz.show_leaderboard ?? true,
      });
      setActiveTab("details");
      // Questions will be fetched lazily when the tab is clicked.
      setQuestions([]);
    }
  }, [quiz, isOpen]);

  useEffect(() => {
    if (activeTab === "questions" && questions.length === 0) {
      fetchQuestions();
    }
  }, [activeTab]);

  if (!isOpen || !quiz) return null;

  const quizStartTime = new Date(quiz.quiz_start_time);
  const hasStarted = quizStartTime <= new Date();

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        quiz_id: quiz.id || quiz.quiz_id,
        quiz_name: formData.quiz_name,
        quiz_duration: parseInt(formData.quiz_duration),
        quiz_difficulty: formData.quiz_difficulty,
        show_leaderboard: formData.show_leaderboard,
      };

      if (!hasStarted) {
        payload.quiz_start_time = new Date(
          formData.quiz_start_time,
        ).toISOString();
      }

      await quizApi.updateQuiz(payload);
      toast.success("Quiz details updated successfully!");
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold font-vend text-slate-900 dark:text-white">
            Edit Quiz
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "details"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Quiz Details
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`py-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "questions"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Questions
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "details" ? (
            <form
              id="edit-quiz-form"
              onSubmit={handleSaveDetails}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quiz Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.quiz_name}
                  onChange={(e) =>
                    setFormData({ ...formData, quiz_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Start Time</span>
                    {hasStarted && (
                      <span className="text-xs text-amber-500 flex items-center gap-1">
                        <Lock size={12} /> Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="datetime-local"
                    required
                    disabled={hasStarted}
                    value={formData.quiz_start_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quiz_start_time: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition ${hasStarted ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {hasStarted && (
                    <p className="text-xs text-slate-500 mt-1">
                      Cannot change start time after quiz has started.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quiz_duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quiz_duration: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.quiz_difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quiz_difficulty: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.show_leaderboard}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            show_leaderboard: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Show Leaderboard
                    </span>
                  </label>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 p-4 rounded-xl flex gap-3 text-sm">
                <Info className="shrink-0 mt-0.5" size={18} />
                <div>
                  <strong>Coming Soon!</strong> Editing individual questions
                  directly from this dashboard will be supported in a future
                  update. For now, you can view the questions below.
                </div>
              </div>

              {fetchingQuestions ? (
                <div className="py-8 text-center text-slate-500">
                  Loading questions...
                </div>
              ) : questions.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No questions found for this quiz.
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 opacity-80 pointer-events-none"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Question {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          {q.question_type}
                        </span>
                      </div>
                      <Question
                        question={{
                          question: q.question,
                          type: q.question_type,
                          options: q.options,
                        }}
                      />
                      {q.correct_answer && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            Correct Answer:{" "}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {q.correct_answer}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          {activeTab === "details" && (
            <button
              type="submit"
              form="edit-quiz-form"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
