import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import { Role } from "../types/index.js";
import { Loader } from "../components/common/Loader.js";

interface RoleRouteProps {
  children: React.ReactElement;
  allowedRoles: Role[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEF2F8] dark:bg-[#0D1B3E]">
        <Loader message="Checking authorization..." size={32} />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // If not authorized, redirect to their home page based on role, or to landing
    if (user) {
      if (user.role === "student") return <Navigate to="/student" replace />;
      if (user.role === "admin") return <Navigate to="/admin" replace />;
      if (user.role === "hod") return <Navigate to="/hod" replace />;
      if (user.role === "dean") return <Navigate to="/dean" replace />;
      if (user.role === "faculty") return <Navigate to="/faculty" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
