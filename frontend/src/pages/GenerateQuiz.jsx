import { useState, useEffect } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Sources from "../components/Generate/Sources";
import ConfigureQuiz from "../components/Generate/ConfigureQuiz";
import PreviewQuiz from "../components/Generate/PreviewQuiz";

import { quizApi } from "../api/quizApi";
import { ingestApi } from "../api/ingestApi";


const defaultConfig = {
  quiz_name: "",
  question_count: 10,
  quiz_difficulty: "MEDIUM",
  quiz_start_time: "",
  quiz_duration: 15,
  show_leaderboard: true,
  question_types: ["scq", "mcq"],
};


export default function GenerateQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [quizId, setQuizId] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [ingestingUrls, setIngestingUrls] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);

  const [config, setConfig] = useState(defaultConfig);


  useEffect(() => {
    const draftId = searchParams.get("draft");

    if (draftId) {
      loadDraft(parseInt(draftId, 10));
    }
  }, [searchParams]);


  const loadDraft = async (draftQuizId) => {
    setLoading(true);

    try {
      const [
        quizResponse,
        resourcesResponse,
        questionsResponse,
      ] = await Promise.all([
        quizApi.getQuizDetails(draftQuizId),
        ingestApi.getResources(draftQuizId),
        quizApi.getHostQuizQuestions(draftQuizId),
      ]);

      const quiz = quizResponse.data;
      const resources = resourcesResponse.data || [];
      const savedQuestions = questionsResponse.data || [];

      setQuizId(draftQuizId);

      setConfig({
        quiz_name: quiz.quiz_name || "",
        question_count: quiz.question_count || 10,
        quiz_difficulty: quiz.quiz_difficulty || "MEDIUM",
        quiz_start_time: quiz.quiz_start_time
          ? new Date(quiz.quiz_start_time)
              .toISOString()
              .slice(0, 16)
          : "",
        quiz_duration: quiz.quiz_duration || 15,
        show_leaderboard: quiz.show_leaderboard ?? true,
        question_types: quiz.question_types || ["scq", "mcq"],
      });

      setFiles(
        resources.map((resource) => ({
          id: `server-${resource.id}`,
          file: null,
          name: resource.filename,
          size: `${resource.file_size_mb} MB`,
          progress: 100,
          uploaded: true,
          error: false,
          uploading: false,
          resourceId: resource.id,
        }))
      );

      setQuestions(savedQuestions);

      setStep(
        savedQuestions.length > 0
          ? 3
          : resources.length > 0
            ? 2
            : 1
      );

      toast.info(
        `Resuming draft: "${quiz.quiz_name}"`
      );

    } catch (error) {
      console.error("Failed to load draft:", error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to load draft quiz"
      );

    } finally {
      setLoading(false);
    }
  };


  const handleNext = async () => {
    if (step === 1) {
      if (!config.quiz_name.trim()) {
        return toast.error("Please enter a quiz name");
      }

      if (!config.quiz_start_time) {
        return toast.error("Please select a start date and time");
      }

      if (!config.question_types.length) {
        return toast.error("Please select at least one question type");
      }

      try {
        const payload = {
          ...config,
          question_count: parseInt(
            config.question_count,
            10
          ),
          quiz_difficulty: config.quiz_difficulty.toUpperCase(),
          quiz_start_time: new Date(
            config.quiz_start_time
          ).toISOString(),
          quiz_duration: parseInt(
            config.quiz_duration,
            10
          ),
          status: "draft",
        };

        if (quizId) {
          await quizApi.updateQuiz({
            ...payload,
            quiz_id: quizId,
          });

        } else {
          const response = await quizApi.createQuiz(payload);

          setQuizId(
            response.data.quiz_id ||
            response.data.id
          );
        }

        setStep(2);

      } catch (error) {
        console.error(error);

        toast.error(
          error.response?.data?.detail ||
          "Failed to save quiz configuration"
        );
      }

      return;
    }


    if (step === 2) {
      if (!quizId) {
        return toast.error(
          "Save the quiz configuration first."
        );
      }

      if (files.some((file) => file.uploading)) {
        return toast.info(
          "Wait for file uploads to finish."
        );
      }

      if (files.some((file) => file.error)) {
        return toast.error(
          "Remove or retry files that failed to upload."
        );
      }

      setIngestingUrls(true);

      try {
        const failedUrls = [];
        let firstUrlError = null;

        for (const url of urls) {
          try {
            await ingestApi.ingestUrl(url, quizId);

          } catch (error) {
            failedUrls.push(url);

            if (!firstUrlError) {
              firstUrlError = error;
            }
          }
        }

        setUrls(failedUrls);

        if (firstUrlError) {
          toast.error(
            firstUrlError.response?.data?.detail ||
            "One or more website URLs could not be processed. Failed URLs remain in the list for retry."
          );

          return;
        }

        if (urls.length) {
          toast.success(
            "Website content extracted successfully."
          );
        }

        const resourcesResponse =
          await ingestApi.getResources(quizId);

        if (!resourcesResponse.data?.length) {
          toast.error(
            "Upload at least one supported file or add a readable website URL."
          );

          return;
        }

        setStep(3);

      } catch (error) {
        console.error(
          "Resource ingestion failed:",
          error
        );

        toast.error(
          error.response?.data?.detail ||
          "Failed to process resources."
        );

      } finally {
        setIngestingUrls(false);
      }
    }
  };


  const handleGenerate = async () => {
    if (!quizId || generating) return;

    setGenerating(true);

    try {
      const response = await quizApi.generateAIQuiz(
        quizId
      );

      const generatedQuestions =
        response.data?.questions;

      const expectedCount = parseInt(
        config.question_count,
        10
      );

      if (
        !Array.isArray(generatedQuestions) ||
        generatedQuestions.length !== expectedCount
      ) {
        throw new Error(
          `The backend did not save the expected ${expectedCount} questions.`
        );
      }

      setQuestions(generatedQuestions);

      toast.success(
        `${generatedQuestions.length} questions generated and saved successfully.`
      );

    } catch (error) {
      console.error(
        "Question generation failed:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        error.message ||
        "Question generation failed."
      );

    } finally {
      setGenerating(false);
    }
  };


  const handlePublish = async () => {
    if (!quizId || publishing) return;

    const expectedCount = parseInt(
      config.question_count,
      10
    );

    if (questions.length !== expectedCount) {
      toast.error(
        `Generate and save exactly ${expectedCount} questions before publishing.`
      );

      return;
    }

    setPublishing(true);

    try {
      await quizApi.publishQuiz(quizId);

      toast.success(
        "Quiz published successfully!"
      );

      navigate("/host");

    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to publish quiz"
      );

    } finally {
      setPublishing(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen pt-30 pb-12 px-6 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-600 dark:text-slate-400 font-semibold">
            Loading draft...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen pt-30 pb-12 px-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-vend">
      <div className="max-w-6xl mx-auto">

        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold mb-3 text-black dark:text-white">
            Generate a Quiz
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Configure the parameters, upload your content,
            and let our AI craft the quiz.
          </p>
        </header>


        <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 md:pb-0">
          {[
            { num: 1, label: "Configuration" },
            { num: 2, label: "Resources" },
            { num: 3, label: "Preview Quiz" },
          ].map(({ num, label }, index) => (
            <div
              key={num}
              className="flex items-center gap-4"
            >
              {index > 0 && (
                <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              )}

              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  step === num
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : step > num
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                }`}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">
                  {num}
                </span>

                <span className="font-semibold whitespace-nowrap">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>


        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 min-h-[500px]">
          {step === 1 && (
            <ConfigureQuiz
              config={config}
              setConfig={setConfig}
            />
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
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={
                ingestingUrls ||
                generating ||
                publishing
              }
              className="px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={ingestingUrls}
              className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {ingestingUrls
                ? "Processing resources..."
                : "Next Step"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={
                questions.length !==
                  parseInt(config.question_count, 10) ||
                publishing ||
                generating
              }
              className="px-8 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing
                ? "Publishing..."
                : `Publish Quiz (${questions.length}/${config.question_count})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
