import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { Bell, ChevronRight, Sun, Moon, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { LogoMark } from "../common/LogoMark.js";
import { notificationService } from "../../services/notification.service.js";

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { dark, setDark } = useTheme();
  const { systemName } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || user.role !== "student") return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently ignore — backend may not be ready yet
    }
  }, [user]);

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 60_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchUnreadCount]);

  // Re-fetch count whenever the route changes (e.g. coming back from notifications page)
  useEffect(() => {
    fetchUnreadCount();
  }, [location.pathname, fetchUnreadCount]);

  if (!user) return null;

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";

  // Helper to format breadcrumb names based on URL pathname
  const getBreadcrumbName = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    if (paths.length === 0) return "Home";
    if (paths.length === 1) return "Dashboard";
    const sub = paths[1];
    if (sub === "help") return "Help & FAQ";
    if (sub === "privacy") return "Privacy Policy";
    return sub.replace("-", " ");
  };

  const handleBellClick = () => {
    if (user.role === "student") {
      navigate("/student/notifications");
    }
  };

  return (
    <header className={`flex items-center justify-between px-6 py-3.5 border-b sticky top-0 z-20 backdrop-blur-sm ${
      dark ? "border-white/8 bg-[#0D1B3E]/90" : "border-[#0B3D91]/8 bg-[#EEF2F8]/90"
    }`}>
      <div className="flex items-center gap-2 text-sm">
        <LogoMark size={24} dark={dark} />
        <span className={textSub}>{systemName} Faculty Feedback System</span>
        <ChevronRight size={14} className={textSub} />
        <span className={`font-semibold capitalize ${textPrimary}`}>
          {getBreadcrumbName()}
        </span>
      </div>

      <div className="flex items-center gap-3">

        {/* Notifications bell — student only */}
        {user.role === "student" && (
          <button
            id="header-notifications-bell"
            onClick={handleBellClick}
            title="Notifications"
            className={`relative p-2.5 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
              dark ? "border-white/10 bg-white/5 text-white" : "border-[#0B3D91]/10 bg-white text-[#0D1B3E]"
            }`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[3px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-md">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setDark(!dark)}
          className={`p-2.5 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
            dark ? "border-white/10 bg-white/5 text-white" : "border-[#0B3D91]/10 bg-white text-[#0D1B3E]"
          }`}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Dropdown */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className={`text-xs font-semibold ${textPrimary}`}>{user.name}</div>
            <div className={`text-[10px] uppercase ${textSub}`}>{user.role}</div>
          </div>
          <ChevronDown size={12} className={textSub} />
        </div>
      </div>
    </header>
  );
};

export default Header;
