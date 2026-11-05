import api from "../utils/api";

const cleanId = (id) => {
  const value = String(id ?? "").trim();

  if (!/^\d+$/.test(value)) {
    throw new Error("Invalid quiz ID");
  }

  return parseInt(value, 10);
};

export const ingestApi = {
  uploadFile: (formData, quizId) =>
    api.post(
      `/ingest/upload?quiz_id=${cleanId(quizId)}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  ingestUrl: (quizId, url) =>
    api.post("/ingest/url", null, {
      params: {
        quiz_id: cleanId(quizId),
        url,
      },
    }),

  getResources: (quizId) =>
    api.get(`/ingest/resources/${cleanId(quizId)}`),

  deleteResource: (quizId, resourceId) =>
    api.delete(
      `/ingest/resources/${cleanId(quizId)}/${cleanId(resourceId)}`
    ),
};

export default ingestApi;
