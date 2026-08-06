import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsService } from "../services/settings.service.js";

interface SettingsContextProps {
  systemName: string;
  instituteName: string;
  logoUrl: string;
  googleLoginEnabled: boolean;
  anonymousFeedback: boolean;
  autoActivateBasedOnDate: boolean;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextProps>({
  systemName: "KNIT",
  instituteName: "Kamla Nehru Institute of Technology",
  logoUrl: "",
  googleLoginEnabled: true,
  anonymousFeedback: true,
  autoActivateBasedOnDate: true,
  loading: true,
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemName, setSystemName] = useState(() => localStorage.getItem("systemName") || "KNIT");
  const [instituteName, setInstituteName] = useState(() => localStorage.getItem("instituteName") || "Kamla Nehru Institute of Technology");
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("logoUrl") || "");
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(true);
  const [anonymousFeedback, setAnonymousFeedback] = useState(true);
  const [autoActivateBasedOnDate, setAutoActivateBasedOnDate] = useState(true);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res?.success && res.data) {
        setSystemName(res.data.systemName);
        setInstituteName(res.data.instituteName);
        setLogoUrl(res.data.logoUrl || "");
        setGoogleLoginEnabled(res.data.googleLoginEnabled ?? true);
        setAnonymousFeedback(res.data.anonymousFeedback ?? true);
        setAutoActivateBasedOnDate(res.data.autoActivateBasedOnDate ?? true);
        
        localStorage.setItem("systemName", res.data.systemName);
        localStorage.setItem("instituteName", res.data.instituteName);
        localStorage.setItem("logoUrl", res.data.logoUrl || "");
        
        document.title = `${res.data.systemName} Faculty Feedback System`;
      }
    } catch (error) {
      console.error("Failed to load global settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();

    // Listen for cross-tab or component storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "systemName" && e.newValue) setSystemName(e.newValue);
      if (e.key === "instituteName" && e.newValue) setInstituteName(e.newValue);
      if (e.key === "logoUrl") setLogoUrl(e.newValue || "");
    };

    const handleCustomStorageEvent = () => {
      setSystemName(localStorage.getItem("systemName") || "KNIT");
      setInstituteName(localStorage.getItem("instituteName") || "Kamla Nehru Institute of Technology");
      setLogoUrl(localStorage.getItem("logoUrl") || "");
      refreshSettings(); // fetch rest of settings like googleLoginEnabled
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("storage", handleCustomStorageEvent); // Using the same event name as we trigger in Settings.tsx
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("storage", handleCustomStorageEvent);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ systemName, instituteName, logoUrl, googleLoginEnabled, anonymousFeedback, autoActivateBasedOnDate, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
