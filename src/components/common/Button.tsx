import React from "react";

interface ModBtnProps {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "danger";
  onClick?: () => void;
  icon?: React.ComponentType<{ size: number; className?: string }>;
}

export const Button: React.FC<ModBtnProps> = ({
  children,
  variant = "primary",
  onClick,
  icon: Icon,
}) => {
  const styles = {
    primary: "bg-[#0B3D91] text-white hover:bg-[#0a348a] shadow-sm",
    outline: "border border-[#0B3D91]/15 text-[#0B3D91] hover:bg-[#EEF2F8]",
    ghost: "text-[#5A6E8E] hover:bg-[#EEF2F8]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${styles[variant]}`}
    >
      {Icon && <Icon size={13} className="shrink-0" />}
      {children}
    </button>
  );
};

export default Button;
