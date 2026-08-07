import React, { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar.js";
import { Header } from "./Header.js";
import { useTheme } from "../../context/ThemeContext.js";

export const DashboardLayout: React.FC = () => {
  const { dark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bg = dark ? "bg-[#0D1B3E]" : "bg-[#EEF2F8]";

  return (
    <div className={`min-h-screen flex ${bg}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Reusable Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Reusable Header */}
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
