import React from "react";
import { useTheme } from "../../context/ThemeContext.js";
import { cn } from "../admin/AdminShared.js";

interface AcademicSessionDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const ACADEMIC_SESSIONS = [
  "2024-25",
  "2025-26",
  "2026-27",
  "2027-28",
  "2028-29",
];

export const AcademicSessionDropdown: React.FC<AcademicSessionDropdownProps> = ({
  value,
  onChange,
  className,
  disabled = false,
}) => {
  const { dark } = useTheme();

  const inputCls = dark
    ? "bg-white/8 border-white/10 text-white"
    : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 transition-all",
        inputCls,
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <option value="" disabled>Select Academic Session</option>
      {ACADEMIC_SESSIONS.map((session) => (
        <option key={session} value={session}>
          {session}
        </option>
      ))}
    </select>
  );
};
