import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface SearchBarProps {
  dark: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  dark,
  placeholder = "Search…",
  value,
  onChange,
}) => {
  const bg = dark
    ? "bg-white/8 border-white/10 text-white placeholder:text-white/30"
    : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E] placeholder:text-[#5A6E8E]/60";

  return (
    <div className="relative flex-1 max-w-md">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E8E]" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 transition-all ${bg}`}
      />
    </div>
  );
};

interface SelectDropdownProps {
  dark: boolean;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  dark,
  options,
  value,
  onChange,
}) => {
  const bg = dark
    ? "bg-white/8 border-white/10 text-white"
    : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]";

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-4 pr-10 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 transition-all cursor-pointer ${bg}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className={dark ? "bg-[#132052] text-white" : "bg-white text-[#0D1B3E]"}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6E8E] pointer-events-none" />
    </div>
  );
};
