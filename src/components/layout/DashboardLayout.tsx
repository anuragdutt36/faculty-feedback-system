import React, { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar.js";
import { Header } from "./Header.js";
import { useTheme } from "../../context/ThemeContext.js";

export const DashboardLayout: React.FC = () => {
  const { dark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bg = dark ? "bg-[#0D1B3E]" : "bg-[#EEF2F8]";

  return (
    <div className={`min-h-screen flex ${bg}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Reusable Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Reusable Header */}
        <Header />

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
