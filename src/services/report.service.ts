import { apiFetch, apiDownload } from "./api.js";

export const reportService = {
  getIndividualReport: async (facultyId: string, sessionId: string) => {
    return await apiFetch(`/reports/faculty/${facultyId}/session/${sessionId}`);
  },

  getConsolidatedReport: async (sessionId: string) => {
    return await apiFetch(`/reports/class/session/${sessionId}`);
  },

  getDepartmentReport: async (branchId: string, sessionId: string) => {
    return await apiFetch(`/reports/department/branch/${branchId}/session/${sessionId}`);
  },

  getTrendReport: async (courseId: string, branchId: string) => {
    return await apiFetch(`/reports/trend/course/${courseId}/branch/${branchId}`);
  },

  downloadIndividualReport: async (facultyId: string, sessionId: string, format: "pdf" | "excel") => {
    const ext = format === "pdf" ? "pdf" : "xlsx";
    await apiDownload(`/reports/faculty/${facultyId}/session/${sessionId}?format=${format}`, `Individual_Report_${facultyId}.${ext}`);
  },

  downloadConsolidatedReport: async (sessionId: string, format: "pdf" | "excel") => {
    const ext = format === "pdf" ? "pdf" : "xlsx";
    await apiDownload(`/reports/class/session/${sessionId}?format=${format}`, `Consolidated_Report_${sessionId}.${ext}`);
  }
};

export default reportService;
