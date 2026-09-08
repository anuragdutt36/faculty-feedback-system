import { API_BASE_URL } from "./api.js";
import {
  PlatformAdminUser,
  PlatformDashboardData,
  PlatformAuditItem,
  NotificationLogItem,
} from "../types/platform.js";

const getPlatformToken = () => localStorage.getItem("ff-platform-token");

const platformFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getPlatformToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/platform${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    throw new Error("Unable to connect to the authentication service. Please check your network connection and try again.");
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status} (${response.statusText || "Error"})`);
    }
    data = {};
  }

  if (!response.ok) {
    let msg = "Platform request failed";
    if (typeof data?.message === "string" && data.message.trim()) {
      msg = data.message;
    } else if (typeof data?.error === "string" && data.error.trim()) {
      msg = data.error;
    } else if (data?.message && typeof data.message === "object") {
      msg = JSON.stringify(data.message);
    }
    throw new Error(msg);
  }
  return data;
};

export const platformService = {
  login: async (username: string, password: string) => {
    return platformFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  getMe: async (): Promise<{ success: boolean; data: PlatformAdminUser }> => {
    return platformFetch("/auth/me");
  },

  logout: async (refreshToken?: string) => {
    return platformFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  getDashboardStats: async (): Promise<{ success: boolean; data: PlatformDashboardData }> => {
    return platformFetch("/dashboard/stats");
  },

  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    severity?: string;
  }): Promise<{
    success: boolean;
    data: {
      logs: PlatformAuditItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.action) query.set("action", params.action);
    if (params?.severity) query.set("severity", params.severity);

    const qStr = query.toString() ? `?${query.toString()}` : "";
    return platformFetch(`/audit-logs${qStr}`);
  },

  getNotificationLogs: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      logs: NotificationLogItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qStr = query.toString() ? `?${query.toString()}` : "";
    return platformFetch(`/notification-logs${qStr}`);
  },

  // Applications Review Pipeline
  getApplications: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      applications: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qStr = query.toString() ? `?${query.toString()}` : "";
    return platformFetch(`/applications${qStr}`);
  },

  getApplicationById: async (id: string): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/applications/${id}`);
  },

  updateChecklist: async (
    id: string,
    verificationChecklist: any,
    adminNotes?: string
  ): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/applications/${id}/checklist`, {
      method: "PATCH",
      body: JSON.stringify({ verificationChecklist, adminNotes }),
    });
  },

  putUnderReview: async (
    id: string,
    adminNotes?: string
  ): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/applications/${id}/under-review`, {
      method: "POST",
      body: JSON.stringify({ adminNotes }),
    });
  },

  rejectApplication: async (
    id: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionReason, adminNotes }),
    });
  },

  deleteApplication: async (id: string): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/applications/${id}`, {
      method: "DELETE",
    });
  },

  // Phase 6: Approve Application & Provision Tenant
  approveApplication: async (
    id: string,
    payload: {
      customSlug?: string;
      allowedEmailDomains?: string[];
      adminNotes?: string;
    }
  ): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/applications/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Phase 7: Institutions Directory & Tenant Management
  getInstitutions: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      institutions: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qStr = query.toString() ? `?${query.toString()}` : "";
    return platformFetch(`/institutions${qStr}`);
  },

  getInstitutionById: async (id: string): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/institutions/${id}`);
  },

  updateInstitution: async (id: string, data: any): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/institutions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  suspendInstitution: async (
    id: string,
    reason: string
  ): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/institutions/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  reactivateInstitution: async (id: string): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/institutions/${id}/reactivate`, {
      method: "POST",
    });
  },

  deleteInstitution: async (id: string): Promise<{ success: boolean; data: any }> => {
    return platformFetch(`/institutions/${id}`, {
      method: "DELETE",
    });
  },
};

export default platformService;
