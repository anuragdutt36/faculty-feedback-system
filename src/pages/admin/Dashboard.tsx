import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  GraduationCap, Users, Activity, CheckCircle2, Building2, BookOpen,
  TrendingUp, TrendingDown, Star, Plus, Download,
  UserPlus, BookPlus, PlayCircle, HelpCircle, GitMerge, FileText, X, RefreshCw,
  Calendar, Clock, ExternalLink, ShieldCheck, Loader2, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useAuth } from "../../context/AuthContext.js";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { Badge } from "../../components/common/Badge.js";
import { StatusDot } from "../../components/common/StatusDot.js";
import { analyticsService } from "../../services/analytics.service.js";
import { settingsService } from "../../services/settings.service.js";

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { dark } = useTheme();
  const { systemName, instituteName } = useSettings();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    activeSessions: 0,
    closedSessions: 0,
    completionRate: "0%",
    averageRating: "0.00",
    totalBranches: 0,
    totalSubjects: 0,
    totalCourses: 0,
    totalYears: 0,
    totalSemesters: 0
  });

  const [ratingDist, setRatingDist] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [res, logsRes] = await Promise.allSettled([
        analyticsService.getDashboardMetrics(),
        settingsService.getAuditLogs(),
      ]);

      if (res.status === "fulfilled" && res.value?.success && res.value.data) {
        const { metrics: m, ratingDistribution, trend, departments } = res.value.data;
        if (m) {
          setMetrics({
            totalStudents: m.totalStudents || 0,
            totalFaculty: m.totalFaculty || 0,
            activeSessions: m.activeSessions || 0,
            closedSessions: m.closedSessions || 0,
            completionRate: m.completionRate || "0%",
            averageRating: m.averageRating || "0.00",
            totalBranches: m.totalBranches || 0,
            totalSubjects: m.totalSubjects || 0,
            totalCourses: m.totalCourses || 0,
            totalYears: m.totalYears || 0,
            totalSemesters: m.totalSemesters || 0
          });
        }
        if (ratingDistribution) {
          const totalRatings = ratingDistribution.reduce((acc: number, item: any) => acc + item.count, 0);
          const mapped = [5, 4, 3, 2, 1].map(rNum => {
            const match = ratingDistribution.find((item: any) => item._id === rNum);
            const pct = totalRatings > 0 ? Math.round(((match?.count || 0) / totalRatings) * 100) : 0;
            const labels = ["Poor (1)", "Average (2)", "Good (3)", "Very Good (4)", "Excellent (5)"];
            return {
              label: labels[rNum - 1],
              value: pct
            };
          }).reverse();
          setRatingDist(mapped);
        }
        setTrendData(trend || []);
        setDeptData(departments || []);
      }

      if (logsRes.status === "fulfilled" && logsRes.value?.success) {
        setAuditLogs((logsRes.value.data || []).slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const cards = [
    { label: "Total Students", value: metrics.totalStudents, sub: "Registered accounts", icon: GraduationCap, color: "bg-[#0B3D91]" },
    { label: "Total Faculty", value: metrics.totalFaculty, sub: "Across departments", icon: Users, color: "bg-[#3B82F6]" },
    { label: "Total Courses", value: metrics.totalCourses, sub: "Degree Programs", icon: ShieldCheck, color: "bg-violet-500" },
    { label: "Total Branches", value: metrics.totalBranches, sub: "Engineering & Science", icon: Building2, color: "bg-emerald-500" },
    { label: "Total Years", value: metrics.totalYears, sub: "Academic Year levels", icon: Calendar, color: "bg-amber-500" },
    { label: "Total Semesters", value: metrics.totalSemesters, sub: "Active evaluation sems", icon: BookOpen, color: "bg-pink-500" }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome, {user?.name || "Admin"} 👋
          </h1>
          <p className={`text-sm mt-0.5 ${textSub}`}>
            Academic Session {"2026-27"} feedback status &nbsp;·&nbsp; 
            <span className="text-emerald-500 font-semibold"> {metrics.activeSessions} active sessions</span>
            <span className="text-gray-400 font-semibold"> ({metrics.closedSessions} closed)</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadDashboardData}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:scale-105 cursor-pointer ${
              dark ? "border-white/10 bg-white/5 text-white" : "border-[#0B3D91]/10 bg-white text-[#0D1B3E]"
            }`}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => navigate("/admin/sessions")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B3D91] text-white hover:bg-[#0a348a] transition-all shadow-md shadow-[#0B3D91]/25 cursor-pointer border-0"
          >
            <Plus size={14} /> New Session
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 size={40} className="animate-spin text-[#0B3D91]" />
          <p className={`text-sm mt-3 font-semibold ${textSub}`}>Loading live dashboard widgets...</p>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {cards.map(({ label, value, sub, icon: Icon, color }) => (
              <div
                key={label}
                className={`rounded-2xl p-5 border transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-default shadow-sm ${
                  dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/10"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
                <div className={`text-3xl font-bold mb-1 ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
                <div className={`text-sm font-semibold mb-0.5 ${dark ? "text-white/80" : "text-[#0D1B3E]/80"}`}>{label}</div>
                <div className={`text-xs ${textSub}`}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex items-center justify-between p-5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><Activity size={22} /></div>
                <div>
                  <h4 className={`text-2xl font-bold ${textPrimary}`}>{metrics.activeSessions}</h4>
                  <p className={`text-xs ${textSub}`}>Active Feedback Evaluation Sessions</p>
                </div>
              </div>
            </div>
            <div className={`flex items-center justify-between p-5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white"><CheckCircle2 size={22} /></div>
                <div>
                  <h4 className={`text-2xl font-bold ${textPrimary}`}>{metrics.completionRate}</h4>
                  <p className={`text-xs ${textSub}`}>Overall Student Response Completion Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 rounded-2xl border p-5 shadow-sm ${cardBg}`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Feedback Trend</h3>
                  <p className={`text-xs mt-0.5 ${textSub}`}>Submissions & avg rating over semesters</p>
                </div>
                <Badge variant="success">Live Database Synced</Badge>
              </div>
              {trendData.length === 0 || !trendData.some(t => t.submissions > 0) ? (
                <div className="flex flex-col items-center justify-center h-[220px] text-center text-xs text-gray-400 font-medium">
                  <AlertCircle size={24} className="mb-2 text-gray-400/60" />
                  No feedback submission trends recorded yet in the database.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart id="dash-trend" data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)"} />
                    <XAxis dataKey="sem" tick={{ fontSize: 11, fill: dark ? "#8AAAD4" : "#5A6E8E" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: dark ? "#8AAAD4" : "#5A6E8E" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: dark ? "#132052" : "#fff", border: "1px solid rgba(11,61,145,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: dark ? "#fff" : "#0D1B3E", fontWeight: 600 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "#3B82F6" }} />
                    <Area type="monotone" dataKey="ratingScaled" name="Avg Rating (×100)" stroke="#0B3D91" fill="#0B3D91" fillOpacity={0.1} strokeWidth={2} dot={{ r: 3, fill: "#0B3D91" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
              <div className="mb-5">
                <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Dept. Performance</h3>
                <p className={`text-xs mt-0.5 ${textSub}`}>Avg rating by department</p>
              </div>
              {deptData.length === 0 || !deptData.some(d => d.rating > 0) ? (
                <div className="flex flex-col items-center justify-center h-[220px] text-center text-xs text-gray-400 font-medium">
                  <AlertCircle size={24} className="mb-2 text-gray-400/60" />
                  No department ratings recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart id="dash-deptbar" data={deptData} layout="vertical" margin={{ top: 0, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)"} horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10, fill: dark ? "#8AAAD4" : "#5A6E8E" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: dark ? "#8AAAD4" : "#5A6E8E" }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip contentStyle={{ background: dark ? "#132052" : "#fff", border: "1px solid rgba(11,61,145,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="rating" fill="#0B3D91" radius={[0, 6, 6, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Rating Distribution */}
            <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
              <h3 className={`font-semibold text-sm mb-5 ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Rating Distribution</h3>
              <div className="space-y-3">
                {ratingDist.length > 0 && ratingDist.some(r => r.value > 0) ? (
                  ratingDist.map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={textSub}>{label}</span>
                        <span className={`font-semibold ${textPrimary}`}>{value}%</span>
                      </div>
                      <div className={`h-2 rounded-full ${dark ? "bg-white/10" : "bg-[#EEF2F8]"}`}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${value}%`,
                            background: value >= 30 ? "#0B3D91" : value >= 15 ? "#3B82F6" : value >= 10 ? "#10B981" : value >= 6 ? "#F59E0B" : "#EF4444"
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs font-semibold text-gray-400">No ratings collected yet</div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
              <h3 className={`font-semibold text-sm mb-4 ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: UserPlus, label: "Add Faculty", path: "/admin/faculty" },
                  { icon: BookPlus, label: "Add Subject", path: "/admin/subjects" },
                  { icon: PlayCircle, label: "New Session", path: "/admin/sessions" },
                  { icon: Download, label: "Generate Report", path: "/admin/reports" },
                  { icon: HelpCircle, label: "Manage Questions", path: "/admin/questions" },
                  { icon: GitMerge, label: "Faculty Mapping", path: "/admin/mapping" },
                ].map(({ icon: Icon, label, path }) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center text-xs font-semibold transition-all hover:scale-105 hover:shadow-md cursor-pointer ${
                      dark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-[#0B3D91]/8 bg-[#F0F4FA] text-[#0D1B3E] hover:bg-white"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-[#0B3D91]`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className={`rounded-2xl border p-5 space-y-4 shadow-sm ${cardBg}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>System Status</h3>
                <Badge variant="success"><StatusDot status="active" /> Operational</Badge>
              </div>
              {[
                { label: "API Server", statusText: "Connected" },
                { label: "Database (MongoDB)", statusText: "Connected" },
                { label: "Auth Service", statusText: "Active" },
                { label: "Report Engine", statusText: "Ready" },
                { label: "Notification Service", statusText: "Active" }
              ].map(({ label, statusText }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusDot status="online" />
                    <span className={`text-xs ${textPrimary}`}>{label}</span>
                  </div>
                  <span className={`text-xs font-medium text-emerald-500`}>{statusText}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail Snippet */}
          <div className={`rounded-2xl border p-5 shadow-sm ${cardBg} mt-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>System Activity Trail</h3>
              <button
                onClick={() => navigate("/admin/audit")}
                className="text-[10px] text-[#3B82F6] font-semibold hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
              >
                Full audit logs <ExternalLink size={10} />
              </button>
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No activity logs recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log._id} className={`flex items-center gap-2 text-[10px] font-mono py-1 border-b last:border-0 border-white/5 ${textSub}`}>
                  <span className="text-emerald-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={textPrimary}>{log.userId?.username || "System"}</span>
                  <span className="text-[#3B82F6]">{log.action}</span>
                  <span className="text-gray-400 truncate max-w-xs">{log.details}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <div className={`text-center text-[10px] pb-2 ${textSub}`}>
        {systemName} v2.0.0 &nbsp;·&nbsp; {instituteName} &nbsp;·&nbsp; <span className="text-emerald-500">All systems operational</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
