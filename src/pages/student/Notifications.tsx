import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Trash2, Inbox, BellRing, AlertOctagon, CheckCircle2,
  Users, Wrench, Calendar, Sparkles, SquareCheck, Loader2
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { notificationService, INotification } from "../../services/notification.service.js";

type NotifFilter = "all" | "unread" | "feedback" | "academic" | "system";

// Map a notification to a display icon based on title keywords and category
const resolveIcon = (n: INotification) => {
  const t = n.title.toLowerCase();
  if (t.includes("submitted") || t.includes("success")) return CheckCircle2;
  if (t.includes("deadline") || t.includes("reminder") || t.includes("closes")) return AlertOctagon;
  if (t.includes("assigned") || t.includes("faculty")) return Users;
  if (t.includes("maintenance") || t.includes("system") || t.includes("update")) return Wrench;
  if (t.includes("calendar") || t.includes("schedule") || t.includes("exam")) return Calendar;
  if (t.includes("portal") || t.includes("new feature") || t.includes("v2")) return Sparkles;
  if (n.category === "academic") return Users;
  if (n.category === "system") return Wrench;
  return BellRing;
};

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const Notifications: React.FC = () => {
  const { dark } = useTheme();
  const [filter, setFilter] = useState<NotifFilter>("all");
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetching marks all as read server-side automatically
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filtered = notifications.filter((n) => {
    const matchFilter =
      filter === "all" ? true :
      filter === "unread" ? !n.isRead :
      n.category === filter;
    const matchSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await notificationService.markOneRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const deleteNotif = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";

  const categoryColors: Record<string, string> = {
    feedback: "bg-blue-50 text-blue-700 border-blue-200",
    academic: "bg-violet-50 text-violet-700 border-violet-200",
    system: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const categoryLabels: Record<string, string> = {
    feedback: "Feedback",
    academic: "Academic",
    system: "System",
  };

  const filterTabs: { key: NotifFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "feedback", label: "Feedback" },
    { key: "academic", label: "Academic" },
    { key: "system", label: "System" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 size={32} className="animate-spin text-[#0B3D91] mb-3" />
        <p className={`text-sm ${textSub}`}>Loading notifications…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertOctagon size={28} className="text-red-500" strokeWidth={1.5} />
        </div>
        <p className={`text-sm font-semibold ${textPrimary}`}>Could not load notifications</p>
        <p className={`text-xs ${textSub} mt-1 mb-4`}>{error}</p>
        <button
          onClick={loadNotifications}
          className="px-4 py-2 rounded-xl bg-[#0B3D91] text-white text-xs font-semibold hover:bg-[#0a348a] transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Notifications</h1>
        <p className={`text-sm ${textSub} mt-0.5`}>Important updates related to feedback sessions and academic announcements</p>
      </div>

      {/* Search + Mark all read */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6E8E]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications…"
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 transition-all ${
              dark
                ? "bg-white/8 border-white/10 text-white placeholder:text-white/30"
                : "bg-white border-[#0B3D91]/10 text-[#0D1B3E] placeholder:text-[#5A6E8E]/60"
            }`}
          />
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              dark
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                : "bg-white border-[#0B3D91]/10 text-[#0B3D91] hover:bg-[#EEF2F8]"
            }`}
          >
            <SquareCheck size={13} /> Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filter === key
                ? "bg-[#0B3D91] text-white border-[#0B3D91] shadow-md shadow-[#0B3D91]/20"
                : dark
                  ? "bg-white/5 text-blue-200/70 border-white/10 hover:border-white/20 hover:text-white"
                  : "bg-white text-[#5A6E8E] border-[#0B3D91]/10 hover:border-[#0B3D91]/30 hover:text-[#0D1B3E]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[#EEF2F8] dark:bg-white/5 flex items-center justify-center mb-4">
            <Inbox size={32} className="text-[#5A6E8E]" strokeWidth={1.5} />
          </div>
          <h3 className={`font-semibold ${textPrimary} mb-1`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No notifications.</h3>
          <p className={`text-sm ${textSub}`}>{search ? "Try a different search term." : "You have no notifications yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const Icon = resolveIcon(n);
            return (
              <div
                key={n._id}
                className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  n.isRead
                    ? dark
                      ? "bg-white/4 border-white/8 hover:shadow-sm"
                      : "bg-white border-[#0B3D91]/8 hover:shadow-sm"
                    : dark
                      ? "bg-white/5 border-l-4 border-l-[#3B82F6] border-white/10 shadow-sm hover:shadow-md"
                      : "bg-white border-l-4 border-l-[#0B3D91] border-[#0B3D91]/8 shadow-sm shadow-[#0B3D91]/8 hover:shadow-md"
                }`}
                onClick={() => markRead(n._id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.category === "feedback" ? "bg-blue-100 text-blue-600" :
                  n.category === "academic" ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-500"
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${
                        n.isRead ? textPrimary : dark ? "text-blue-300" : "text-[#0B3D91]"
                      }`}>
                        {n.title}
                      </span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#0B3D91] shrink-0" />}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryColors[n.category]}`}>
                        {categoryLabels[n.category]}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#5A6E8E] shrink-0">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className={`text-xs ${textSub} leading-relaxed`}>{n.message}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotif(n._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#5A6E8E] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
