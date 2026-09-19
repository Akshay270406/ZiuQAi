import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { quizApi } from "../api/quizApi";
import EditQuizModal from "../components/Host/EditQuizModal";
import HostHeader from "../components/Host/HostHeader";
import EmptyQuizState from "../components/Host/EmptyQuizState";
import QuizCard from "../components/Host/QuizCard";

export default function Host() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const handleOpenEditModal = (quiz) => {
    setSelectedQuiz(quiz);
    setEditModalOpen(true);
  };

  const fetchQuizzes = async () => {
    try {
      const response = await quizApi.getMyQuizzes();
      setQuizzes(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success("Registration URL copied to clipboard!");
      } else {
        toast.info(`Registration URL: ${text}`);
      }
    } catch (error) {
      console.error("Clipboard copy failed", error);
      toast.error("Failed to copy link to clipboard");
    }
  };

  const handleToggleLeaderboard = async (quizId, currentVisibility) => {
    const newVisibility = !currentVisibility;
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId ? { ...q, show_leaderboard: newVisibility } : q,
      ),
    );
    try {
      await quizApi.updateQuiz({
        quiz_id: quizId,
        show_leaderboard: newVisibility,
      });
      toast.success(`Leaderboard visibility for participants updated`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update leaderboard visibility");
      fetchQuizzes();
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    try {
      await quizApi.deleteQuiz(quizId);
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete quiz");
      fetchQuizzes();
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
            min-h-screen pt-30 pb-12 px-6 
            bg-slate-50 dark:bg-slate-900 
            text-slate-800 dark:text-slate-200
            font-roboto
        "
    >
      <div className="max-w-6xl mx-auto">
        <HostHeader onCreateQuiz={() => navigate("/generate")} />

        {quizzes.length === 0 ? (
          <EmptyQuizState onCreateQuiz={() => navigate("/generate")} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onNavigate={navigate}
                onCopyUrl={copyToClipboard}
                onToggleLeaderboard={handleToggleLeaderboard}
                onOpenEditModal={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <EditQuizModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        quiz={selectedQuiz}
        onSaveSuccess={fetchQuizzes}
      />
    </div>
  );
}
