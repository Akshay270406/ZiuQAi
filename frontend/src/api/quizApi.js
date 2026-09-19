import api from "../utils/api";

const cleanId = (id) => {
  const str = String(id ?? "").trim();
  if (!/^\d+$/.test(str)) {
    throw new Error("Invalid quiz ID");
  }
  return parseInt(str, 10);
};

export const quizApi = {
  createQuiz: (quizData) => api.post("/quizzes/create", quizData),
  updateQuiz: (quizData) =>
    api.put("/quizzes/update", {
      ...quizData,
      quiz_id: cleanId(quizData?.quiz_id),
    }),
  deleteQuiz: (quizId) =>
    api.delete("/quizzes/delete", { data: { quiz_id: cleanId(quizId) } }),
  getMyQuizzes: async () => {
    const res = await api.get("/quizzes/my-quizzes");
    if (res && res.data) {
      res.data = res.data.map((q) => ({
        ...q,
        id: q.id ?? q.quiz_id,
        quiz_difficulty: String(q.quiz_difficulty || "").toLowerCase(),
      }));
    }
    return res;
  },
  getDashboardStats: () => api.get("/quizzes/dashboard/stats"),
  getMyDrafts: () => api.get("/quizzes/my-drafts"),
  getQuizDetails: (quizId) => api.get(`/quizzes/${cleanId(quizId)}`),
  publishQuiz: (quizId) => api.post(`/quizzes/${cleanId(quizId)}/publish`),
  registerForQuiz: (quizId) => api.post(`/quizzes/${cleanId(quizId)}/register`),
  getAttemptQuestions: (quizId) =>
    api.get(`/quizzes/${cleanId(quizId)}/attempt/questions`),
  getAttemptResponses: (quizId) =>
    api.get(`/quizzes/${cleanId(quizId)}/attempt/responses`),
  saveAttemptResponses: (quizId, responses) =>
    api.post(`/quizzes/${cleanId(quizId)}/attempt/save`, { responses }),
  submitQuiz: (quizId, responses) =>
    api.post(`/quizzes/${cleanId(quizId)}/attempt/submit`, { responses }),
  getLeaderboard: (quizId) =>
    api.get(`/quizzes/${cleanId(quizId)}/leaderboard`),
  generateAIQuiz: (quizId) => api.post(`/quizzes/${cleanId(quizId)}/generate`),
  getHostQuizQuestions: (quizId) =>
    api.get(`/questions/quiz/${cleanId(quizId)}`),
  updateQuestion: (quesData) => api.put("/questions/update", quesData),
};

export default quizApi;
