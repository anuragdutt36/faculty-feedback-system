import { apiFetch } from "./api.js";

export const questionService = {
  getQuestions: async () => {
    return await apiFetch("/questions");
  },
  createQuestion: async (data: {
    code?: string;
    text: string;
    category: string;
    type: "rating" | "text" | "mcq";
    weight?: number;
    status?: "active" | "inactive";
    order?: number;
  }) => {
    return await apiFetch("/questions", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  updateQuestion: async (id: string, data: any) => {
    return await apiFetch(`/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  deleteQuestion: async (id: string) => {
    return await apiFetch(`/questions/${id}`, {
      method: "DELETE"
    });
  }
};

export default questionService;
