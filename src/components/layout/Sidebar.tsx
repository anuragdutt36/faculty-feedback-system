import React from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard, Building2, BookOpen, Users, HelpCircle, GitMerge,
  ClipboardList, BarChart3, LineChart, ScrollText, Settings, LogOut,
  Bell, Shield, ChevronLeft, ChevronRight, GraduationCap, History,
  TrendingUp, X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { LogoMark } from "../common/LogoMark.js";
import { useSettings } from "../../context/SettingsContext.js";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { systemName } = useSettings();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    if (onCloseMobile) onCloseMobile();
    navigate("/login");
  };

  const handleItemClick = (path: string) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  // Define sidebar navigation items based on role
  const getNavItems = () => {
    switch (user.role) {
      case "admin":
        return [
          { group: "Main Menu", items: [
            { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { path: "/admin/structure", label: "Academic Structure", icon: Building2 },
            { path: "/admin/subjects", label: "Subjects", icon: BookOpen },
            { path: "/admin/faculty", label: "Faculty", icon: Users },
            { path: "/admin/questions", label: "Question Bank", icon: HelpCircle },
            { path: "/admin/mapping", label: "Mapping", icon: GitMerge },
            { path: "/admin/sessions", label: "Feedback Sessions", icon: ClipboardList },
          ]},
          { group: "Insights", items: [
            { path: "/admin/reports", label: "Reports", icon: BarChart3 },
            { path: "/admin/analytics", label: "Analytics", icon: LineChart },
            { path: "/admin/audit", label: "Audit Logs", icon: ScrollText },
            { path: "/admin/settings", label: "Settings", icon: Settings },
          ]}
        ];
      case "student":
        return [
          { group: "Portal", items: [
            { path: "/student", label: "Active Feedback", icon: ClipboardList },
            { path: "/student/history", label: "Feedback History", icon: History },
            { path: "/student/notifications", label: "Notifications", icon: Bell },
          ]},
          { group: "Support", items: [
            { path: "/student/help", label: "Help & FAQ", icon: HelpCircle },
            { path: "/student/privacy", label: "Privacy Policy", icon: Shield },
          ]}
        ];
      case "hod":
        return [
          { group: "HOD Portal", items: [
            { path: "/hod", label: "Dashboard", icon: LayoutDashboard },
            { path: "/hod/reports", label: "Department Reports", icon: BarChart3 },
          ]}
        ];
      case "faculty":
        return [
          { group: "Faculty Portal", items: [
            { path: "/faculty", label: "Dashboard", icon: LayoutDashboard },
            { path: "/faculty/reports", label: "Feedback Reports", icon: BarChart3 },
            { path: "/faculty/trends", label: "Trends", icon: TrendingUp },
          ]}
        ];
      default:
        return [];
    }
  };

  const navGroups = getNavItems();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    if (path === "/student") return location.pathname === "/student";
    if (path === "/hod") return location.pathname === "/hod";
    if (path === "/faculty") return location.pathname === "/faculty";
    return location.pathname.startsWith(path);
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    return parts.map(w => w[0]).join("").substring(0, 2).toUpperCase();
  };

  const sidebarContent = (showFullLabels: boolean) => (
    <>
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <LogoMark size={36} dark />
          {showFullLabels && (
            <div className="overflow-hidden">
              <div className="text-white font-bold text-sm leading-tight truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {systemName} Faculty Feedback System
              </div>
              <div className="text-blue-200/70 text-xs truncate capitalize">
                {user.role} Portal
              </div>
            </div>
          )}
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {showFullLabels && (
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-300/50 transition-all">
                {group.group}
              </div>
            )}
            {group.items.map((item) => (
              <button
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive(item.path)
                    ? "bg-white/15 text-white"
                    : "text-blue-200/70 hover:bg-white/8 hover:text-white"
                }`}
              >
                <item.icon size={17} className="shrink-0" />
                {showFullLabels && <span className="truncate">{item.label}</span>}
                {showFullLabels && isActive(item.path) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300/80 hover:bg-red-500/10 hover:text-red-200 transition-all cursor-pointer"
        >
          <LogOut size={17} className="shrink-0" />
          {showFullLabels && <span>Logout</span>}
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl bg-white/8 border border-white/10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getUserInitials(user.name)}
          </div>
          {showFullLabels && (
            <div className="overflow-hidden">
              <div className="text-white text-xs font-semibold truncate">{user.name || "Student"}</div>
              <div className="text-blue-200/50 text-[10px] truncate capitalize">{user.role}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay Backdrop & Slide-over Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Drawer Content */}
          <aside
            className="relative w-64 max-w-[80vw] h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200"
            style={{ background: "linear-gradient(180deg, #041030 0%, #0B3D91 100%)" }}
          >
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Persistent Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 overflow-hidden z-30 ${
          isOpen ? "w-64" : "w-16"
        }`}
        style={{ background: "linear-gradient(180deg, #041030 0%, #0B3D91 100%)" }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-white border border-[#0B3D91]/20 shadow-md flex items-center justify-center text-[#0B3D91] hover:bg-[#EEF2F8] transition-colors z-10 cursor-pointer"
        >
          {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
        {sidebarContent(isOpen)}
      </aside>
    </>
  );
};

export default Sidebar;
