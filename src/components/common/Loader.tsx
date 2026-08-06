import React from "react";
import { RefreshCw } from "lucide-react";

interface LoaderProps {
  message?: string;
  size?: number;
}

export const Loader: React.FC<LoaderProps> = ({
  message = "Loading...",
  size = 24,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3 text-[#5A6E8E]">
      <RefreshCw size={size} className="animate-spin text-[#0B3D91]" />
      {message && <span className="text-xs font-semibold">{message}</span>}
    </div>
  );
};

export default Loader;
