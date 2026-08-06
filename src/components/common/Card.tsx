import React from "react";

interface CardProps {
  children: React.ReactNode;
  dark: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  dark,
  className = "",
  onClick,
}) => {
  const bg = dark
    ? "bg-white/5 border-white/10"
    : "bg-white border-[#0B3D91]/8";

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 shadow-sm transition-all ${bg} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
