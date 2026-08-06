import { apiFetch } from "./api.js";

export const analyticsService = {
  getDashboardMetrics: async () => {
    return await apiFetch("/analytics/dashboard");
  },

  getFacultyRanking: async () => {
    return await apiFetch("/analytics/ranking");
  }
};

export default analyticsService;
