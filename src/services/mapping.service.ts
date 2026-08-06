import { apiFetch } from "./api.js";

export const mappingService = {
  getMappings: async () => {
    return await apiFetch("/mappings");
  },
  createMapping: async (data: {
    facultyId: string;
    subjectId: string;
    courseId: string;
    branchId: string;
    semester: number;
    academicYear?: string;
  }) => {
    return await apiFetch("/mappings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateMapping: async (id: string, data: any) => {
    return await apiFetch(`/mappings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteMapping: async (id: string) => {
    return await apiFetch(`/mappings/${id}`, {
      method: "DELETE",
    });
  }
};

export default mappingService;
