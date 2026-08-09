import React, { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar.js";
import { Header } from "./Header.js";
import { useTheme } from "../../context/ThemeContext.js";

export const DashboardLayout: React.FC = () => {
  const { dark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bg = dark ? "bg-[#0D1B3E]" : "bg-[#EEF2F8]";

  return (
    <div className={`min-h-screen flex flex-col ${bg} transition-colors`} style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navigation Header (Desktop horizontal tabs & mobile fixed bar) */}
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Mobile Slide-Over Drawer (Right-sided on mobile) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
