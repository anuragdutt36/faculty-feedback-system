import React from "react";
import { GraduationCap } from "lucide-react";
import { useSettings } from "../../context/SettingsContext.js";

interface LogoMarkProps {
  size?: number;
  dark?: boolean;
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 40, dark = false, className = "" }) => {
  const { logoUrl } = useSettings();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo"
        style={{ width: size, height: size }}
        className={`object-contain rounded-xl p-0.5 bg-white shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center border-2 shrink-0 overflow-hidden ${
        dark ? "border-white/30 bg-white/10" : "border-[#0B3D91]/20 bg-[#EEF2F8]"
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <GraduationCap
        size={size * 0.5}
        className={dark ? "text-white/70" : "text-[#0B3D91]/50"}
        strokeWidth={1.5}
      />
    </div>
  );
};

export default LogoMark;
