import { apiFetch } from "./api.js";

export const studentService = {
  getActiveSessions: async () => {
    return await apiFetch("/sessions/student/active");
  },

  getSubmissionToken: async (sessionId: string, subjectId: string, facultyId: string) => {
    return await apiFetch("/feedback/token", {
      method: "POST",
      body: JSON.stringify({ feedbackSessionId: sessionId, subjectId, facultyId }),
    });
  },

  submitFeedback: async (token: string, ratings: { questionId: string; rating: number }[]) => {
    return await apiFetch("/feedback/submit", {
      method: "POST",
      body: JSON.stringify({ token, ratings }),
    });
  },

  getHistory: async () => {
    return await apiFetch("/feedback/history");
  },

  importStudents: async (file: File) => {
    return await apiFetch("/profiles/students/import", {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    });
  }
};

export default studentService;
