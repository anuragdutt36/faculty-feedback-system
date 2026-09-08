import React from "react";

interface AnimatedCounterProps {
  from?: number;
  to: number | string;
  duration?: number;
  className?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  to, 
  className = "",
  suffix = ""
}) => {
  let displayValue = to;
  if (typeof to === "number") {
    displayValue = to.toLocaleString();
  }

  return <span className={className}>{displayValue}{suffix}</span>;
};

export default AnimatedCounter;
