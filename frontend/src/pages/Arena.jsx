import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Timer,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookmarkPlus,
  AlertTriangle,
} from "lucide-react";
import ThemeChanger from "../components/common/ThemeChanger";
import Question from "../components/Arena/Question";
import Navigation from "../components/Arena/Navigation";
import { quizApi } from "../api/quizApi";

export default function Arena() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [statuses, setStatuses] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submittedRef = useRef(false);

  const isAnswered = (val) => val != null && String(val).trim() !== "";

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const detailsRes = await quizApi.getQuizDetails(quizId);
        if (detailsRes.data.submitted) {
          toast.info("You have already submitted this quiz attempt.");
          navigate(`/standings/${quizId}`);
          return;
        }
        const totalDuration = detailsRes.data.quiz_duration * 60;

        const qRes = await quizApi.getAttemptQuestions(quizId);
        const qList = qRes.data;
        setQuestions(qList);

        // Fetch server draft responses
        let serverResponses = {};
        try {
          const respRes = await quizApi.getAttemptResponses(quizId);
          serverResponses = respRes.data.responses || {};
        } catch (e) {
          console.warn("Could not load server draft responses", e);
        }

        // Fetch local storage responses
        let localAnswers = {};
        try {
          const savedAns = localStorage.getItem(`ziuq_answers_${quizId}`);
          if (savedAns) localAnswers = JSON.parse(savedAns);
        } catch (e) {
          console.warn("Could not load local answers", e);
        }

        const mergedAnswers = { ...serverResponses, ...localAnswers };
        setAnswers(mergedAnswers);

        // Load or initialize statuses
        let savedStatuses = {};
        try {
          const s = localStorage.getItem(`ziuq_statuses_${quizId}`);
          if (s) savedStatuses = JSON.parse(s);
        } catch (e) {}

        const initialStatuses = {};
        qList.forEach((q, idx) => {
          if (savedStatuses[idx]) {
            initialStatuses[idx] = savedStatuses[idx];
          } else if (isAnswered(mergedAnswers[q.id])) {
            initialStatuses[idx] = "complete";
          } else {
            initialStatuses[idx] = idx === 0 ? "current" : "notVisited";
          }
        });
        setStatuses(initialStatuses);

        // Timer wall-clock expiration persistence capped at absolute quiz_end_time
        const savedExpires = localStorage.getItem(`ziuq_expires_at_${quizId}`);
        let remainingSeconds = totalDuration;
        if (savedExpires && !isNaN(parseInt(savedExpires, 10))) {
          const diff = Math.floor(
            (parseInt(savedExpires, 10) - Date.now()) / 1000,
          );
          remainingSeconds = diff > 0 ? diff : 0;
        } else {
          const absoluteEndMs = detailsRes.data?.quiz_start_time
            ? new Date(detailsRes.data.quiz_start_time).getTime() +
              totalDuration * 1000
            : Date.now() + totalDuration * 1000;
          const expiresAt = Math.min(
            Date.now() + totalDuration * 1000,
            absoluteEndMs,
          );
          localStorage.setItem(
            `ziuq_expires_at_${quizId}`,
            expiresAt.toString(),
          );
          const diff = Math.floor((expiresAt - Date.now()) / 1000);
          remainingSeconds = diff > 0 ? diff : 0;
        }
        setTime(remainingSeconds);
      } catch (err) {
        console.error(err);
        toast.error(
          err.response?.data?.detail || "Failed to load quiz attempt",
        );
        navigate("/attempt");
      } finally {
        setLoading(false);
      }
    };
    loadQuizData();
  }, [quizId, navigate]);

  // Persist answers and statuses locally
  useEffect(() => {
    if (!loading && quizId) {
      try {
        localStorage.setItem(`ziuq_answers_${quizId}`, JSON.stringify(answers));
        localStorage.setItem(
          `ziuq_statuses_${quizId}`,
          JSON.stringify(statuses),
        );
      } catch (e) {}
    }
  }, [answers, statuses, loading, quizId]);

  // Timer effect using real wall-clock target without interval re-creation loop
  useEffect(() => {
    if (loading || questions.length === 0) return;

    const checkAndTick = () => {
      const savedExpires = localStorage.getItem(`ziuq_expires_at_${quizId}`);
      if (!savedExpires) return;
      const expiresAt = parseInt(savedExpires, 10);
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTime(remaining);
      if (remaining <= 0) {
        if (!submittedRef.current) {
          handleSubmit(true);
        }
      }
    };

    checkAndTick();
    const timer = setInterval(checkAndTick, 1000);

    return () => clearInterval(timer);
  }, [loading, questions.length, quizId]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(Math.max(0, totalSeconds) / 60);
    const s = Math.floor(Math.max(0, totalSeconds) % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (answer) => {
    const currentQ = questions[questionIndex];
    if (!currentQ) return;
    const updated = { ...answersRef.current, [currentQ.id]: answer };
    answersRef.current = updated;
    setAnswers(updated);
    quizApi.saveAttemptResponses(quizId, updated).catch(() => {});
  };

  const handleMarkReview = () => {
    const nextIdx =
      questionIndex < questions.length - 1 ? questionIndex + 1 : questionIndex;
    setStatuses((prev) => {
      const nextStatus = { ...prev, [questionIndex]: "markForReview" };
      if (nextIdx !== questionIndex && prev[nextIdx] === "notVisited") {
        nextStatus[nextIdx] = "current";
      }
      return nextStatus;
    });
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(nextIdx);
    }
  };

  const handleSaveNext = () => {
    const currentQ = questions[questionIndex];
    const hasAns = isAnswered(answersRef.current[currentQ.id]);
    const nextIdx =
      questionIndex < questions.length - 1 ? questionIndex + 1 : questionIndex;
    setStatuses((prev) => {
      const nextStatus = {
        ...prev,
        [questionIndex]: hasAns ? "complete" : "current",
      };
      if (nextIdx !== questionIndex && prev[nextIdx] === "notVisited") {
        nextStatus[nextIdx] = "current";
      }
      return nextStatus;
    });
    quizApi.saveAttemptResponses(quizId, answersRef.current).catch(() => {});
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(nextIdx);
    }
  };

  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);
      setStatuses((prev) => ({
        ...prev,
        [questionIndex]:
          prev[questionIndex] === "notVisited"
            ? "current"
            : prev[questionIndex],
        [nextIdx]: prev[nextIdx] === "notVisited" ? "current" : prev[nextIdx],
      }));
    }
  };

  const handlePrev = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    }
  };

  const handleSelectQuestion = (idx) => {
    setQuestionIndex(idx);
    setStatuses((prev) => {
      if (prev[idx] === "notVisited") {
        return { ...prev, [idx]: "current" };
      }
      return prev;
    });
  };

  const handleSubmit = async (auto = false) => {
    if (submittedRef.current || submitting) return;
    if (
      !auto &&
      !window.confirm("Are you sure you want to submit your quiz attempt?")
    )
      return;

    submittedRef.current = true;
    setSubmitting(true);
    try {
      const currentAnswers = answersRef.current;
      await quizApi.submitQuiz(quizId, currentAnswers);
      localStorage.removeItem(`ziuq_answers_${quizId}`);
      localStorage.removeItem(`ziuq_statuses_${quizId}`);
      localStorage.removeItem(`ziuq_expires_at_${quizId}`);
      toast.success("Quiz submitted successfully!");
      navigate(`/standings/${quizId}`);
    } catch (err) {
      console.error(err);
      submittedRef.current = false;
      toast.error("Failed to submit quiz responses");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold mb-2">No Questions Found</h3>
        <p className="text-slate-500 mb-6">
          This quiz has no questions generated yet.
        </p>
        <button
          onClick={() => navigate("/attempt")}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentQ = questions[questionIndex];

  return (
    <div
      className="
            w-full min-h-screen px-4 md:px-16 py-8
            bg-slate-50 dark:bg-slate-900 
            text-slate-800 dark:text-slate-100 
            font-vend
        "
    >
      <section className="flex justify-between items-center mb-10">
        <div
          className="
                    text-lg font-bold border-2 border-violet-600 
                    px-4 py-2 rounded-xl text-violet-600 dark:text-violet-400
                "
        >
          Question {questionIndex + 1} / {questions.length}
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`
                        flex items-center gap-2 px-4 py-2 
                        border-2 rounded-xl font-bold font-mono
                        ${time < 60 ? "border-red-500 text-red-500 animate-pulse" : "border-violet-600 text-violet-600 dark:text-violet-400"}
                    `}
          >
            <Timer size={18} />
            {formatTime(time)}
          </div>

          <ThemeChanger />

          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="
                            px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl transition
                            flex items-center gap-2 shadow-sm
                        "
          >
            <CheckCircle2 size={16} />
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <Question
            question={currentQ}
            selectedAnswer={answers[currentQ.id]}
            onAnswerChange={handleAnswerChange}
          />

          <div className="flex flex-wrap gap-4 justify-between mt-12 pt-6 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleMarkReview}
              className="
                                px-5 py-2.5 rounded-xl border border-violet-600 text-violet-600
                                dark:text-violet-400 dark:border-violet-400
                                hover:bg-violet-600 hover:text-white transition font-bold flex items-center gap-2 text-sm
                            "
            >
              <BookmarkPlus size={16} />
              Mark for Review
            </button>
            <button
              onClick={handleSaveNext}
              className="
                                px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition
                                font-bold flex items-center gap-2 text-sm shadow-sm
                            "
            >
              Save and Next
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-center lg:justify-end">
          <Navigation
            questions={questions}
            statuses={statuses}
            currentIndex={questionIndex}
            onSelect={handleSelectQuestion}
          />
        </div>
      </div>

      <section className="flex justify-center gap-6 mt-12 pb-10">
        <button
          onClick={handlePrev}
          disabled={questionIndex === 0}
          className="
                        rounded-full p-3 border-2 border-violet-600 text-violet-600 dark:text-violet-400
                        hover:bg-violet-600 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed
                    "
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          disabled={questionIndex === questions.length - 1}
          className="
                        rounded-full p-3 border-2 border-violet-600 text-violet-600 dark:text-violet-400
                        hover:bg-violet-600 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed
                    "
        >
          <ArrowRight size={20} />
        </button>
      </section>
    </div>
  );
}
