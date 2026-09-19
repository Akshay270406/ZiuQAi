import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Sources from "../components/Generate/Sources";
import ConfigureQuiz from "../components/Generate/ConfigureQuiz";
import PreviewQuiz from "../components/Generate/PreviewQuiz";
import { quizApi } from "../api/quizApi";
import { ingestApi } from "../api/ingestApi";

const GenerateQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [quizId, setQuizId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lifted state for sources
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);

  const [config, setConfig] = useState({
    quiz_name: "",
    question_count: 10,
    quiz_difficulty: "MEDIUM",
    quiz_start_time: "",
    quiz_duration: 15,
    show_leaderboard: true,
    question_types: ["scq", "mcq"],
  });

  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (draftId) {
      loadDraft(parseInt(draftId));
    }
  }, [searchParams]);

  const loadDraft = async (draftQuizId) => {
    setLoading(true);
    try {
      const quizRes = await quizApi.getQuizDetails(draftQuizId);
      const quiz = quizRes.data;

      setQuizId(draftQuizId);
      setConfig({
        quiz_name: quiz.quiz_name || "",
        question_count: quiz.question_count || 10,
        quiz_difficulty: quiz.quiz_difficulty || "MEDIUM",
        quiz_start_time: quiz.quiz_start_time
          ? new Date(quiz.quiz_start_time).toISOString().slice(0, 16)
          : "",
        quiz_duration: quiz.quiz_duration || 15,
        show_leaderboard: quiz.show_leaderboard ?? true,
        question_types: quiz.question_types || ["scq", "mcq"],
      });

      const resourcesRes = await ingestApi.getResources(draftQuizId);
      const resources = resourcesRes.data || [];

      const restoredFiles = resources.map((r) => ({
        id: `server-${r.id}`,
        file: null,
        name: r.filename,
        size: r.file_size_mb + " MB",
        progress: 100,
        uploaded: true,
        error: false,
        uploading: false,
        resourceId: r.id,
      }));
      setFiles(restoredFiles);
      setStep(restoredFiles.length > 0 ? 2 : 1);
      toast.info(`Resuming draft: "${quiz.quiz_name}"`);
    } catch (err) {
      console.error("Failed to load draft:", err);
      toast.error("Failed to load draft quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!config.quiz_name.trim()) {
        toast.error("Please enter a quiz name");
        return;
      }
      if (!config.quiz_start_time) {
        toast.error("Please select a start date and time");
        return;
      }
      if (config.question_types.length === 0) {
        toast.error("Please select at least one question type");
        return;
      }

      try {
        const payload = {
          quiz_name: config.quiz_name,
          question_count: parseInt(config.question_count),
          quiz_difficulty: config.quiz_difficulty.toUpperCase(),
          quiz_start_time: new Date(config.quiz_start_time).toISOString(),
          quiz_duration: parseInt(config.quiz_duration),
          show_leaderboard: config.show_leaderboard,
          status: "draft",
          question_types: config.question_types,
        };

        if (quizId) {
          await quizApi.updateQuiz({ ...payload, quiz_id: quizId });
        } else {
          const res = await quizApi.createQuiz(payload);
          setQuizId(res.data.quiz_id || res.data.id);
        }
        setStep(2);
      } catch (err) {
        console.error(err);
        toast.error("Failed to save quiz configuration");
      }
    } else if (step === 2) {
      const hasUploadedFiles = files.some((f) => f.uploaded);
      if (!hasUploadedFiles && urls.length === 0) {
        toast.error(
          "Please upload at least one file or add a website link before proceeding.",
        );
        return;
      }
      setStep(3);
    }
  };

  const handleGenerate = async () => {
    if (!quizId) return;
    setGenerating(true);
    try {
      const res = await quizApi.generateAIQuiz(quizId);
      setQuestions(res.data.questions || []);
      toast.success("AI generated questions successfully!");
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        "Failed to generate questions. Ensure you have uploaded resources first.";
      toast.error(detail);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!quizId) return;
    setPublishing(true);
    try {
      await quizApi.publishQuiz(quizId);
      toast.success("Quiz published successfully!");
      navigate("/host");
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish quiz");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-30 pb-12 px-6 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold">
            Loading draft...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
            min-h-screen pt-30 pb-12 px-6 
            bg-slate-50 dark:bg-slate-900 
            text-slate-800 dark:text-slate-200
            font-vend
        "
    >
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold font-vend mb-3 text-black dark:text-white">
            Generate a Quiz
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Configure the parameters, upload your content, and let our AI craft
            the perfect quiz for you in seconds.
          </p>
        </header>

        <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 md:pb-0">
          {[
            { num: 1, label: "Configuration" },
            { num: 2, label: "Resources" },
            { num: 3, label: "Preview Quiz" },
          ].map(({ num, label }, idx) => (
            <div key={num} className="flex items-center gap-4">
              {idx > 0 && (
                <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              )}
              <div
                className={`
                                flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300
                                ${
                                  step === num
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                    : step > num
                                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400"
                                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                                }
                            `}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">
                  {num}
                </span>
                <span className="font-semibold whitespace-nowrap">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="
                    bg-white dark:bg-slate-800 
                    rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700
                    p-6 md:p-8 min-h-[500px]
                "
        >
          {step === 1 && (
            <ConfigureQuiz config={config} setConfig={setConfig} />
          )}
          {step === 2 && (
            <Sources
              quizId={quizId}
              files={files}
              setFiles={setFiles}
              urls={urls}
              setUrls={setUrls}
            />
          )}
          {step === 3 && (
            <PreviewQuiz
              quizId={quizId}
              questions={questions}
              onGenerate={handleGenerate}
              generating={generating}
            />
          )}
        </div>

        <div className="flex justify-end mt-8 gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="
                                px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white 
                                hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none
                            "
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={questions.length === 0 || publishing}
              className="
                                px-8 py-3 rounded-xl font-bold bg-green-600 text-white 
                                hover:bg-green-700 transition shadow-lg shadow-green-200 dark:shadow-none
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
            >
              {publishing ? "Publishing..." : "Publish Quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateQuiz;
