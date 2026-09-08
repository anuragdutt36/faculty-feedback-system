import React, { createContext, useContext, useState, useEffect } from "react";
import { PlatformAdminUser } from "../types/platform.js";
import { platformService } from "../services/platform.service.js";

interface PlatformAuthContextType {
  isPlatformAuthenticated: boolean;
  platformAdmin: PlatformAdminUser | null;
  platformLogin: (username: string, password: string) => Promise<void>;
  platformLogout: () => void;
  platformLoading: boolean;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platformAdmin, setPlatformAdmin] = useState<PlatformAdminUser | null>(null);
  const [platformLoading, setPlatformLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const response = await platformService.getMe();
      if (response && response.success) {
        setPlatformAdmin(response.data);
        localStorage.setItem("ff-platform-admin", JSON.stringify(response.data));
      } else {
        platformLogout();
      }
    } catch {
      const token = localStorage.getItem("ff-platform-token");
      if (!token) platformLogout();
    } finally {
      setPlatformLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("ff-platform-token");
    const cached = localStorage.getItem("ff-platform-admin");
    if (cached) {
      try {
        setPlatformAdmin(JSON.parse(cached));
        setPlatformLoading(false);
      } catch (e) {}
    }

    if (token) {
      fetchProfile();
    } else {
      setPlatformLoading(false);
    }
  }, []);

  const platformLogin = async (username: string, password: string) => {
    setPlatformLoading(true);
    try {
      const response = await platformService.login(username, password);
      if (response && response.success) {
        localStorage.setItem("ff-platform-token", response.data.accessToken);
        localStorage.setItem("ff-platform-refresh-token", response.data.refreshToken);
        setPlatformAdmin(response.data.admin);
        localStorage.setItem("ff-platform-admin", JSON.stringify(response.data.admin));
      } else {
        throw new Error(response.message || "Platform login failed");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setPlatformLoading(false);
    }
  };

  const platformLogout = () => {
    const refreshToken = localStorage.getItem("ff-platform-refresh-token");
    if (refreshToken) {
      platformService.logout(refreshToken).catch(() => {});
    }
    setPlatformAdmin(null);
    localStorage.removeItem("ff-platform-admin");
    localStorage.removeItem("ff-platform-token");
    localStorage.removeItem("ff-platform-refresh-token");
  };

  return (
    <PlatformAuthContext.Provider
      value={{
        isPlatformAuthenticated: !!platformAdmin,
        platformAdmin,
        platformLogin,
        platformLogout,
        platformLoading,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error("usePlatformAuth must be used within a PlatformAuthProvider");
  }
  return context;
};
