import React from "react";
import { Navigate, useLocation } from "react-router";
import { usePlatformAuth } from "../context/PlatformAuthContext.js";

export const PlatformProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPlatformAuthenticated, platformLoading } = usePlatformAuth();
  const location = useLocation();

  if (platformLoading) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Verifying platform administrator session...</p>
      </div>
    );
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to="/platform-admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PlatformProtectedRoute;
