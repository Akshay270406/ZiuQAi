import { useEffect, useState } from "react";
import {
  Lock,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { quizApi } from "../../api/quizApi";


const emptyQuestion = {
  question: "",
  question_type: "scq",
  correct_answer: "",
  options_text: "",
};


const getOptionsText = (options) =>
  Array.isArray(options)
    ? options.join("\n")
    : "";


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
  const [questionSaving, setQuestionSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);

  const [formData, setFormData] = useState({
    quiz_name: "",
    quiz_start_time: "",
    quiz_duration: 15,
    quiz_difficulty: "MEDIUM",
    show_leaderboard: true,
  });

  const quizId = quiz?.id || quiz?.quiz_id;

  const hasStarted = quiz?.quiz_start_time
    ? new Date(quiz.quiz_start_time) <= new Date()
    : false;

  const isDraft = quiz?.status === "draft";


  const fetchQuestions = async () => {
    if (!quizId) return;

    setFetchingQuestions(true);

    try {
      const response = await quizApi.getHostQuizQuestions(
        quizId
      );

      setQuestions(response.data || []);

    } catch (error) {
      console.error(
        "Failed to fetch questions:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to load quiz questions."
      );

    } finally {
      setFetchingQuestions(false);
    }
  };


  useEffect(() => {
    if (quiz && isOpen) {
      setFormData({
        quiz_name: quiz.quiz_name || "",
        quiz_start_time: quiz.quiz_start_time
          ? new Date(quiz.quiz_start_time)
              .toISOString()
              .slice(0, 16)
          : "",
        quiz_duration: quiz.quiz_duration || 15,
        quiz_difficulty: String(
          quiz.quiz_difficulty || "MEDIUM"
        ).toUpperCase(),
        show_leaderboard: quiz.show_leaderboard ?? true,
      });

      setActiveTab("details");
      setQuestions([]);
      setEditingId(null);
      setQuestionForm(emptyQuestion);
    }
  }, [quiz, isOpen]);


  useEffect(() => {
    if (isOpen && activeTab === "questions") {
      fetchQuestions();
    }
  }, [activeTab, isOpen, quizId]);


  if (!isOpen || !quiz) return null;


  const handleSaveDetails = async (event) => {
    event.preventDefault();

    setLoading(true);

    try {
      const payload = {
        quiz_id: quizId,
        quiz_name: formData.quiz_name.trim(),
        quiz_duration: parseInt(
          formData.quiz_duration,
          10
        ),
        quiz_difficulty: formData.quiz_difficulty,
        show_leaderboard: formData.show_leaderboard,
      };

      if (!hasStarted && formData.quiz_start_time) {
        payload.quiz_start_time = new Date(
          formData.quiz_start_time
        ).toISOString();
      }

      await quizApi.updateQuiz(payload);

      toast.success(
        "Quiz details updated successfully!"
      );

      onSaveSuccess?.();
      onClose();

    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to update quiz"
      );

    } finally {
      setLoading(false);
    }
  };


  const startEditing = (question) => {
    setEditingId(question.id);

    setQuestionForm({
      question: question.question || "",
      question_type: question.question_type || "scq",
      correct_answer: question.correct_answer || "",
      options_text: getOptionsText(question.options),
    });
  };


  const resetQuestionForm = () => {
    setEditingId(null);
    setQuestionForm(emptyQuestion);
  };


  const saveQuestion = async (event) => {
    event.preventDefault();

    if (!isDraft) {
      return toast.error(
        "Questions in a published quiz cannot be changed."
      );
    }

    if (
      !questionForm.question.trim() ||
      !questionForm.correct_answer.trim()
    ) {
      return toast.error(
        "Enter both the question and its correct answer."
      );
    }

    const questionType = questionForm.question_type;

    const options =
      questionType === "fib"
        ? null
        : questionType === "tof"
          ? ["True", "False"]
          : questionForm.options_text
              .split(/[\n,]/)
              .map((option) => option.trim())
              .filter(Boolean);

    if (
      ["scq", "mcq"].includes(questionType) &&
      options.length < 2
    ) {
      return toast.error(
        "Add at least two options, one per line."
      );
    }

    const payload = {
      question: questionForm.question.trim(),
      question_type: questionType,
      correct_answer: questionForm.correct_answer.trim(),
      options,
    };

    setQuestionSaving(true);

    try {
      if (editingId) {
        await quizApi.updateQuestion({
          ...payload,
          question_id: editingId,
        });

        toast.success("Question updated.");

      } else {
        await quizApi.createQuestion({
          ...payload,
          quiz_id: quizId,
        });

        toast.success("Question added.");
      }

      resetQuestionForm();
      await fetchQuestions();
      onSaveSuccess?.();

    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
        "Could not save the question."
      );

    } finally {
      setQuestionSaving(false);
    }
  };


  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question?")) {
      return;
    }

    try {
      await quizApi.deleteQuestion(questionId);

      setQuestions((previous) =>
        previous.filter(
          (question) => question.id !== questionId
        )
      );

      if (editingId === questionId) {
        resetQuestionForm();
      }

      toast.success("Question deleted.");
      onSaveSuccess?.();

    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
        "Could not delete the question."
      );
    }
  };


  const updateQuestionField = (field, value) => {
    setQuestionForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">

        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Edit Quiz
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {quiz.quiz_name} · ID {quizId}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>


        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 ${
              activeTab === "details"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Quiz Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 ${
              activeTab === "questions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Questions ({questions.length})
          </button>
        </div>


        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "details" ? (
            <form
              id="edit-quiz-form"
              onSubmit={handleSaveDetails}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Quiz Name
                </label>

                <input
                  type="text"
                  required
                  value={formData.quiz_name}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      quiz_name: event.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Start Time{" "}
                    {hasStarted && (
                      <span className="text-amber-500">
                        <Lock
                          size={12}
                          className="inline"
                        /> Locked
                      </span>
                    )}
                  </label>

                  <input
                    type="datetime-local"
                    required
                    disabled={hasStarted}
                    value={formData.quiz_start_time}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        quiz_start_time: event.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none disabled:opacity-60"
                  />

                  {hasStarted && (
                    <p className="text-xs text-slate-500 mt-1">
                      Cannot change start time after the quiz has started.
                    </p>
                  )}
                </div>


                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Duration (minutes)
                  </label>

                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quiz_duration}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        quiz_duration: event.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Difficulty
                  </label>

                  <select
                    value={formData.quiz_difficulty}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        quiz_difficulty: event.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>


                <label className="flex items-center gap-3 pt-6 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.show_leaderboard}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        show_leaderboard: event.target.checked,
                      })
                    }
                  />
                  Show Leaderboard
                </label>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {!isDraft && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-sm">
                  This quiz is published. Its question set is locked.
                </div>
              )}

              {isDraft && (
                <form
                  onSubmit={saveQuestion}
                  className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold">
                      {editingId
                        ? "Edit Question"
                        : "Add Manual Question"}
                    </h3>

                    {editingId && (
                      <button
                        type="button"
                        onClick={resetQuestionForm}
                        className="text-sm text-slate-500"
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>


                  <textarea
                    required
                    rows={3}
                    value={questionForm.question}
                    onChange={(event) =>
                      updateQuestionField(
                        "question",
                        event.target.value
                      )
                    }
                    placeholder="Enter the question"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  />


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Question Type
                      </label>

                      <select
                        value={questionForm.question_type}
                        onChange={(event) =>
                          updateQuestionField(
                            "question_type",
                            event.target.value
                          )
                        }
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="scq">Single Correct (SCQ)</option>
                        <option value="mcq">Multiple Correct (MCQ)</option>
                        <option value="tof">True / False</option>
                        <option value="fib">Fill in the Blanks</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Correct Answer
                      </label>

                      <input
                        required
                        value={questionForm.correct_answer}
                        onChange={(event) =>
                          updateQuestionField(
                            "correct_answer",
                            event.target.value
                          )
                        }
                        placeholder="Exact answer; comma-separated for MCQ"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>


                  {questionForm.question_type === "scq" ||
                  questionForm.question_type === "mcq" ? (
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Options (one per line)
                      </label>

                      <textarea
                        rows={4}
                        value={questionForm.options_text}
                        onChange={(event) =>
                          updateQuestionField(
                            "options_text",
                            event.target.value
                          )
                        }
                        placeholder={"Option 1\nOption 2\nOption 3\nOption 4"}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {questionForm.question_type === "tof"
                        ? "True/False options are added automatically."
                        : "Fill-in-the-blank questions do not use options."}
                    </p>
                  )}


                  <button
                    type="submit"
                    disabled={questionSaving}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />

                    {questionSaving
                      ? "Saving..."
                      : editingId
                        ? "Save Question"
                        : "Add Question"}
                  </button>
                </form>
              )}


              {fetchingQuestions ? (
                <div className="py-8 text-center text-slate-500">
                  Loading questions...
                </div>
              ) : questions.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No questions saved for this quiz yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-indigo-600 uppercase mb-1">
                            Question {index + 1} · {question.question_type}
                          </p>

                          <p className="font-semibold">
                            {question.question}
                          </p>

                          {question.options?.length > 0 && (
                            <ul className="list-disc pl-5 mt-2 text-sm text-slate-600 dark:text-slate-300">
                              {question.options.map((option, optionIndex) => (
                                <li key={`${question.id}-${optionIndex}`}>
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}

                          <p className="text-sm mt-2">
                            <span className="font-semibold text-green-600">
                              Answer:{" "}
                            </span>
                            {question.correct_answer}
                          </p>
                        </div>

                        {isDraft && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditing(question)}
                              title="Edit question"
                              className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteQuestion(question.id)}
                              title="Delete question"
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-slate-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>


        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>

          {activeTab === "details" && (
            <button
              type="submit"
              form="edit-quiz-form"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
