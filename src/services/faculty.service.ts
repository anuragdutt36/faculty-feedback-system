import { apiFetch } from "./api.js";

export const facultyService = {
  getFacultyList: async () => {
    return await apiFetch("/profiles/faculty");
  },

  createFaculty: async (data: any) => {
    return await apiFetch("/profiles/faculty", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateFaculty: async (id: string, data: any) => {
    return await apiFetch(`/profiles/faculty/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteFaculty: async (id: string) => {
    return await apiFetch(`/profiles/faculty/${id}`, {
      method: "DELETE",
    });
  },

  resetPassword: async (id: string, newPassword?: string) => {
    return await apiFetch(`/profiles/faculty/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  },

  importFaculty: async (file: File) => {
    return await apiFetch("/profiles/faculty/import", {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    });
  }
};

export default facultyService;
