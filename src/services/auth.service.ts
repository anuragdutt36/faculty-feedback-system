import { apiFetch } from "./api.js";

export const authService = {
  login: async (username: string, password?: string) => {
    return await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

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
