import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import { Loader } from "../components/common/Loader.js";

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEF2F8] dark:bg-[#0D1B3E]">
        <Loader message="Verifying authentication..." size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
