import React, { createContext, useContext, useState, useEffect } from "react";
import { Role } from "../types/index.js";
import { authService } from "../services/auth.service.js";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  rollNumber?: string;
  role: Role;
  course?: string;
  branch?: string;
  semester?: number;
  year?: number;
  academicSession?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (username: string, password?: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const response = await authService.getMe();
      if (response && response.success) {
        const u = response.data.user;
        const prof = response.data.profile;
        const newUser: UserProfile = {
          id: u.id,
          username: u.username,
          name: prof?.name || "Student",
          rollNumber: prof?.enrollmentNo || (u.username ? (u.username.match(/\d+/)?.[0] || "") : ""),
          role: u.role as Role,
          course: prof?.courseId?.name || prof?.course,
          branch: prof?.branchId?.code || prof?.branchId?.name || prof?.branch,
          semester: prof?.semester,
          year: prof?.year,
          academicSession: prof?.academicSession || "2025-26",
        };
        setUser(newUser);
        localStorage.setItem("knit-user", JSON.stringify(newUser));
      } else {
        logout();
      }
    } catch {
      // If token is invalid/expired, logout; otherwise keep user if cached
      const token = localStorage.getItem("knit-auth-token");
      if (!token) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("knit-auth-token");
    const cachedUser = localStorage.getItem("knit-user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setLoading(false);
      } catch (e) {}
    }
    
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password?: string) => {
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      if (response && response.success) {
        localStorage.setItem("knit-auth-token", response.data.accessToken);
        localStorage.setItem("knit-refresh-token", response.data.refreshToken);
        
        const u = response.data.user;
        const prof = response.data.profile;
        const newUser: UserProfile = {
          id: u.id,
          username: u.username,
          name: prof?.name || "System Admin",
          rollNumber: prof?.enrollmentNo || (u.username ? (u.username.match(/\d+/)?.[0] || "") : ""),
          role: u.role as Role,
          course: prof?.courseId?.name || prof?.course,
          branch: prof?.branchId?.code || prof?.branchId?.name || prof?.branch,
          semester: prof?.semester,
          year: prof?.year,
          academicSession: prof?.academicSession || "2025-26",
        };
        setUser(newUser);
        localStorage.setItem("knit-user", JSON.stringify(newUser));
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await authService.googleLogin(idToken);
      if (response && response.success) {
        localStorage.setItem("knit-auth-token", response.data.accessToken);
        localStorage.setItem("knit-refresh-token", response.data.refreshToken);
        
        const u = response.data.user;
        const prof = response.data.profile;
        const newUser: UserProfile = {
          id: u.id,
          username: u.username,
          name: prof?.name || "Student",
          rollNumber: prof?.enrollmentNo || (u.username ? (u.username.match(/\d+/)?.[0] || "") : ""),
          role: u.role as Role,
          course: prof?.courseId?.name || prof?.course,
          branch: prof?.branchId?.code || prof?.branchId?.name || prof?.branch,
          semester: prof?.semester,
          year: prof?.year,
          academicSession: prof?.academicSession || "2025-26",
        };
        setUser(newUser);
        localStorage.setItem("knit-user", JSON.stringify(newUser));
      } else {
        throw new Error(response.message || "Google Authentication failed");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("knit-refresh-token");
    if (refreshToken) {
      authService.logout(refreshToken).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem("knit-user");
    localStorage.removeItem("knit-auth-token");
    localStorage.removeItem("knit-refresh-token");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        googleLogin,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
