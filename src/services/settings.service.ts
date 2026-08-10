import { apiFetch } from "./api.js";

export const settingsService = {
  getSettings: async () => {
    return await apiFetch("/settings");
  },
  getPublicStats: async () => {
    return await apiFetch("/settings/public-stats");
  },

  updateSettings: async (settings: any) => {
    return await apiFetch("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },

  getAuditLogs: async () => {
    return await apiFetch("/settings/audit");
  },

  seedDatabase: async () => {
    return await apiFetch("/settings/seed", {
      method: "POST"
    });
  },

  clearDatabase: async () => {
    return await apiFetch("/settings/clear", {
      method: "POST"
    });
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    return await apiFetch("/settings/logo", {
      method: "POST",
      body: formData,
    });
  },

  deleteLogo: async () => {
    return await apiFetch("/settings/logo", {
      method: "DELETE",
    });
  },

  // Roll Mappings
  getRollMappings: async () => {
    return await apiFetch("/roll-mappings");
  },
  createRollMapping: async (data: any) => {
    return await apiFetch("/roll-mappings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateRollMapping: async (id: string, data: any) => {
    return await apiFetch(`/roll-mappings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteRollMapping: async (id: string) => {
    return await apiFetch(`/roll-mappings/${id}`, {
      method: "DELETE",
    });
  }
};

export default settingsService;
