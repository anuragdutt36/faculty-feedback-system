import { apiFetch } from "./api.js";

export const sessionService = {
  getSessions: async () => {
    return await apiFetch("/sessions");
  },
  getStudentActiveSessions: async () => {
    // Cache-busted: always fetch fresh data (avoids 304 stale responses)
    const ts = Date.now();
    return await apiFetch(`/student/active-feedback?_t=${ts}`, { cache: "no-store" });
  },
  createSession: async (data: {
    name: string;
    courseId: string;
    branchId: string;
    year: number;
    semester: number;
    academicYear: string;
    startDate: string;
    endDate: string;
    customMessage?: string;
  }) => {
    return await apiFetch("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  activateSession: async (id: string) => {
    return await apiFetch(`/sessions/${id}/activate`, {
      method: "POST",
    });
  },
  closeSession: async (id: string) => {
    return await apiFetch(`/sessions/${id}/close`, {
      method: "POST",
    });
  },
  deleteSession: async (id: string) => {
    return await apiFetch(`/sessions/${id}`, {
      method: "DELETE",
    });
  }
};

export default sessionService;
