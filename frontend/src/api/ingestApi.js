import api from "../utils/api";

export const ingestApi = {
  uploadFile: (formData, quizId) =>
    api.post(`/ingest/upload?quiz_id=${quizId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getResources: (quizId) => api.get(`/ingest/resources/${quizId}`),
  deleteResource: (quizId, resourceId) =>
    api.delete(`/ingest/resources/${quizId}/${resourceId}`),
};

export default ingestApi;
