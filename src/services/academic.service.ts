import { apiFetch } from "./api.js";

export const academicService = {
  // Courses
  getCourses: async () => {
    return await apiFetch("/academic/courses");
  },
  createCourse: async (name: string, duration: number) => {
    return await apiFetch("/academic/courses", {
      method: "POST",
      body: JSON.stringify({ name, duration }),
    });
  },
  updateCourse: async (id: string, name: string, duration: number) => {
    return await apiFetch(`/academic/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, duration }),
    });
  },
  deleteCourse: async (id: string) => {
    return await apiFetch(`/academic/courses/${id}`, {
      method: "DELETE",
    });
  },

  // Branches
  getBranches: async () => {
    return await apiFetch("/academic/branches");
  },
  createBranch: async (code: string, name: string, courseId: string, coordinatorId?: string) => {
    return await apiFetch("/academic/branches", {
      method: "POST",
      body: JSON.stringify({ code, name, courseId, coordinatorId: coordinatorId || undefined }),
    });
  },
  updateBranch: async (id: string, code: string, name: string, courseId: string, coordinatorId?: string) => {
    return await apiFetch(`/academic/branches/${id}`, {
      method: "PUT",
      body: JSON.stringify({ code, name, courseId, coordinatorId: coordinatorId || undefined }),
    });
  },
  deleteBranch: async (id: string) => {
    return await apiFetch(`/academic/branches/${id}`, {
      method: "DELETE",
    });
  },

  // Years
  getYears: async () => {
    return await apiFetch("/academic/years");
  },
  createYear: async (name: string) => {
    return await apiFetch("/academic/years", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },
  updateYear: async (id: string, name: string) => {
    return await apiFetch(`/academic/years/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  },
  deleteYear: async (id: string) => {
    return await apiFetch(`/academic/years/${id}`, {
      method: "DELETE",
    });
  },

  // Semesters
  getSemesters: async () => {
    return await apiFetch("/academic/semesters");
  },
  createSemester: async (name: string, number: number) => {
    return await apiFetch("/academic/semesters", {
      method: "POST",
      body: JSON.stringify({ name, number }),
    });
  },
  updateSemester: async (id: string, name: string, number: number) => {
    return await apiFetch(`/academic/semesters/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, number }),
    });
  },
  deleteSemester: async (id: string) => {
    return await apiFetch(`/academic/semesters/${id}`, {
      method: "DELETE",
    });
  },

  // Subjects
  getSubjects: async () => {
    return await apiFetch("/academic/subjects");
  },
  createSubject: async (code: string, name: string, courseId: string, branchId: string, semester: number) => {
    return await apiFetch("/academic/subjects", {
      method: "POST",
      body: JSON.stringify({ code, name, courseId, branchId, semester }),
    });
  },
  updateSubject: async (id: string, code: string, name: string, courseId: string, branchId: string, semester: number) => {
    return await apiFetch(`/academic/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ code, name, courseId, branchId, semester }),
    });
  },
  deleteSubject: async (id: string) => {
    return await apiFetch(`/academic/subjects/${id}`, {
      method: "DELETE",
    });
  }
};

export default academicService;
