import { apiFetch } from "./api.js";

export const authService = {
  // Admin/Platform login (username + password)
  login: async (username: string, password?: string) => {
    return await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Staff login: Faculty, HOD, Dean — manual email+password, NO Google OAuth
  staffLogin: async (email: string, password: string) => {
    return await apiFetch("/auth/staff/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Student Google OAuth
  googleLogin: async (idToken: string) => {
    return await apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  logout: async (refreshToken: string) => {
    return await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  getMe: async () => {
    return await apiFetch("/auth/me");
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
};

export default authService;
