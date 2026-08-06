import React from "react";
import { Globe, Shield } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { LogoMark } from "../common/LogoMark.js";

export const Footer: React.FC = () => {
  const { dark } = useTheme();
  const { systemName, instituteName, logoUrl } = useSettings();

  return (
    <footer className={`border-t px-8 py-6 mt-auto ${
      dark ? "border-white/10 text-blue-200/50" : "border-[#0B3D91]/10 text-blue-900/60"
    }`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <LogoMark size={28} dark={dark} />
          <div>
            <div className={`font-semibold ${dark ? "text-white" : "text-[#0B3D91]"}`}>{systemName} Faculty Feedback System</div>
            <div>{instituteName}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Globe size={12} /> {(systemName || "KNIT").toLowerCase()}.ac.in</span>
          <span className="flex items-center gap-1"><Shield size={12} /> Privacy Policy</span>
          <span>v2.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
