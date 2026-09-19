import api from "../utils/api";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

export default authApi;
