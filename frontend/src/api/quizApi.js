import api from "../utils/api";

const cleanId = (id) => {
  const value = String(id ?? "").trim();

  if (!/^\d+$/.test(value)) {
    throw new Error("Invalid quiz ID");
  }

  return parseInt(value, 10);
};

export const quizApi = {
  createQuiz: (quizData) =>
    api.post("/quizzes/create", quizData),

  updateQuiz: (quizData) =>
    api.put("/quizzes/update", {
      ...quizData,
      quiz_id: cleanId(quizData?.quiz_id),
    }),

  deleteQuiz: (quizId) =>
    api.delete("/quizzes/delete", {
      data: {
        quiz_id: cleanId(quizId),
      },
    }),

  getMyQuizzes: async () => {
    const response = await api.get("/quizzes/my-quizzes");

    if (response?.data) {
      response.data = response.data.map((quiz) => ({
        ...quiz,
        id: quiz.id ?? quiz.quiz_id,
        quiz_difficulty: String(
          quiz.quiz_difficulty || ""
        ).toLowerCase(),
      }));
    }

    return response;
  },

  getDashboardStats: () =>
    api.get("/quizzes/dashboard/stats"),

  getMyDrafts: () =>
    api.get("/quizzes/my-drafts"),

  getQuizDetails: (quizId) =>
    api.get(`/quizzes/${cleanId(quizId)}`),

  publishQuiz: (quizId) =>
    api.post(`/quizzes/${cleanId(quizId)}/publish`),

  registerForQuiz: (quizId) =>
    api.post(`/quizzes/${cleanId(quizId)}/register`),

  getAttemptQuestions: (quizId) =>
    api.get(`/quizzes/${cleanId(quizId)}/attempt/questions`),

  getAttemptResponses: (quizId) =>
    api.get(`/quizzes/${cleanId(quizId)}/attempt/responses`),

  saveAttemptResponses: (quizId, responses) =>
    api.post(
      `/quizzes/${cleanId(quizId)}/attempt/save`,
      { responses }
    ),

  submitQuiz: (quizId, responses) =>
    api.post(
      `/quizzes/${cleanId(quizId)}/attempt/submit`,
      { responses }
    ),

  getLeaderboard: (quizId) =>
    api.get(`/quizzes/${cleanId(quizId)}/leaderboard`),

  generateAIQuiz: (quizId) =>
    api.post(`/quizzes/${cleanId(quizId)}/generate`),

  getHostQuizQuestions: (quizId) =>
    api.get(`/questions/quiz/${cleanId(quizId)}`),

  createQuestion: (questionData) =>
    api.post("/questions/create", questionData),

  updateQuestion: (questionData) =>
    api.put("/questions/update", questionData),

  deleteQuestion: (questionId) =>
    api.delete("/questions/delete", {
      data: {
        question_id: cleanId(questionId),
      },
    }),
};

export default quizApi;
