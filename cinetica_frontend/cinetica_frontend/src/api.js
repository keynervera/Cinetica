import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    }
    return Promise.reject(err);
  }
);

export const getContent = () => api.get("/content/");
export const getContentDetail = (id) => api.get(`/content/${id}/`);

export const searchTMDB = (q, page = 1) =>
  api.get(`/tmdb/search/?q=${encodeURIComponent(q)}&page=${page}`);

export const tmdbDetail = (tmdbId) => api.get(`/tmdb/movie/${tmdbId}/`);
export const tmdbProviders = (tmdbId, country = "CO") =>
  api.get(`/tmdb/movie/${tmdbId}/providers/?country=${country}`);

export default api;
