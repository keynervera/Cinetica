import api from "./client";

export const getContent = () => api.get("/content/");
export const searchTMDB = (q) =>
  api.get(`/tmdb/search/?q=${encodeURIComponent(q)}`);
