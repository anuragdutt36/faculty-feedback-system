import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "privacy";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-[#E8EEF8] text-[#0B3D91]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    privacy: "bg-violet-50 text-violet-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;
