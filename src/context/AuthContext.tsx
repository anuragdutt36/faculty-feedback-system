import React, { createContext, useContext, useState, useEffect } from "react";
import { Role } from "../types/index.js";
import { authService } from "../services/auth.service.js";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  institutionId?: string;
  rollNumber?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
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
  staffLogin: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildUserProfile = (u: any, prof: any): UserProfile => ({
  id: u.id,
  username: u.username,
  institutionId: u.institutionId || prof?.institutionId,
  name: prof?.name || (u.role === "admin" ? "System Admin" : "User"),
  rollNumber: prof?.enrollmentNo || (u.username ? (u.username.match(/\d+/)?.[0] || "") : ""),
  employeeId: prof?.employeeId,
  designation: prof?.designation,
  department: prof?.department,
  role: u.role as Role,
  course: prof?.courseId?.name || prof?.course,
  branch: prof?.branchId?.code || prof?.branchId?.name || prof?.branch,
  semester: prof?.semester,
  year: prof?.year,
  academicSession: prof?.academicSession || "2025-26",
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const response = await authService.getMe();
      if (response && response.success) {
        const newUser = buildUserProfile(response.data.user, response.data.profile);
        setUser(newUser);
        localStorage.setItem("ffms-auth-user", JSON.stringify(newUser));
        if (newUser.institutionId) {
          sessionStorage.setItem("currentInstitutionId", newUser.institutionId);
        }
      } else {
        logout();
      }
    } catch {
      setUser(null);
      localStorage.removeItem("ffms-auth-user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear legacy keys if present
    localStorage.removeItem("knit-user");

    const cached = localStorage.getItem("ffms-auth-user");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser(parsed);
        if (parsed.institutionId) {
          sessionStorage.setItem("currentInstitutionId", parsed.institutionId);
        }
      } catch {
        localStorage.removeItem("ffms-auth-user");
      }
    }

    // Always attempt to fetch profile to verify HttpOnly cookie session
    fetchProfile();
  }, []);

  // Admin/Platform login
  const login = async (username: string, password?: string) => {
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      if (response && response.success) {
        if (response.data?.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
        }
        const newUser = buildUserProfile(response.data.user, response.data.profile);
        setUser(newUser);
        localStorage.setItem("ffms-auth-user", JSON.stringify(newUser));
        if (newUser.institutionId) {
          sessionStorage.setItem("currentInstitutionId", newUser.institutionId);
        }
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Staff login: Faculty, HOD, Dean — NO Google OAuth, dedicated endpoint
  const staffLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.staffLogin(email, password);
      if (response && response.success) {
        if (response.data?.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
        }
        const newUser = buildUserProfile(response.data.user, response.data.profile);
        setUser(newUser);
        localStorage.setItem("ffms-auth-user", JSON.stringify(newUser));
        if (newUser.institutionId) {
          sessionStorage.setItem("currentInstitutionId", newUser.institutionId);
        }
      } else {
        throw new Error(response.message || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Student Google OAuth
  const googleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await authService.googleLogin(idToken);
      if (response && response.success) {
        if (response.data?.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
        }
        const newUser = buildUserProfile(response.data.user, response.data.profile);
        setUser(newUser);
        localStorage.setItem("ffms-auth-user", JSON.stringify(newUser));
        if (newUser.institutionId) {
          sessionStorage.setItem("currentInstitutionId", newUser.institutionId);
        }
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
    authService.logout("").catch(() => {});
    setUser(null);
    localStorage.removeItem("ffms-auth-user");
    localStorage.removeItem("knit-user");
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        staffLogin,
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
