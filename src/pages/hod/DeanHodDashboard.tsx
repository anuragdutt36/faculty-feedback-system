import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  BarChart3,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Award
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { apiFetch } from "../../services/api.js";

interface DashboardData {
  scopeName: string;
  academicYear: string;
  activeSessions: number;
  overallScore: number;
  responseRate: number;
  evaluatedFacultyCount: number;
  evaluatedSubjectsCount: number;
  departmentRankings?: { name: string; score: number; responseRate: number }[];
  facultyRankings?: { name: string; department: string; score: number; responses: number }[];
}

export const DeanHodDashboard: React.FC = () => {
  const { user } = useAuth();
  const { systemName } = useSettings();
  const navigate = useNavigate();

  const isDean = user?.role === "dean";
  const basePath = isDean ? "/dean" : "/hod";

  const [data, setData] = useState<DashboardData>({
    scopeName: isDean ? "All Academic Departments" : user?.department || "Computer Science & Engineering",
    academicYear: "2025–26",
    activeSessions: 0,
    overallScore: 0,
    responseRate: 0,
    evaluatedFacultyCount: 0,
    evaluatedSubjectsCount: 0,
    departmentRankings: [],
    facultyRankings: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const endpoint = isDean
          ? "/reports/institution/scope"
          : "/reports/department/my-dept";
        const resData = await apiFetch(endpoint);
        if (resData?.success && resData.data) {
          setData((prev) => ({
            ...prev,
            scopeName: resData.data.scopeName || prev.scopeName,
            academicYear: resData.data.academicYear || prev.academicYear,
            activeSessions: resData.data.activeSessions || 0,
            overallScore: resData.data.overallScore || 0,
            responseRate: resData.data.responseRate || 0,
            evaluatedFacultyCount: resData.data.evaluatedFacultyCount || 0,
            evaluatedSubjectsCount: resData.data.evaluatedSubjectsCount || 0,
            departmentRankings: resData.data.departmentRankings || prev.departmentRankings,
            facultyRankings: resData.data.facultyRankings || []
          }));
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isDean]);

  const emptyStateMsg = isDean
    ? "No feedback data is currently available for your assigned academic scope."
    : "No feedback data is available for this department.";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#041030] via-[#0B3D91] to-[#1a5dc8] p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-2 backdrop-blur-sm border border-white/10">
              <Building2 size={12} />
              <span>{isDean ? "Dean Portal • Academic Scope Overview" : `Department: ${data.scopeName}`}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {isDean ? "Dean Academic Governance Dashboard" : "HOD Department Overview"}
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
              {isDean
                ? "Institute-wide faculty evaluation trends, department benchmarking, and academic quality assurance."
                : `Departmental evaluation analytics and faculty performance monitoring for ${data.scopeName}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`${basePath}/reports`)}
              className="px-4 py-2.5 rounded-xl bg-white text-[#0B3D91] hover:bg-blue-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 size={14} />
              <span>{isDean ? "Institute Reports" : "Department Reports"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-4 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-blue-200/60 uppercase tracking-wider block truncate">
            {isDean ? "Institute Score" : "Dept Score"}
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
            <span>{data.overallScore > 0 ? data.overallScore.toFixed(1) : "—"}</span>
            <span className="text-[10px] text-slate-400">/ 5.0</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-4 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-blue-200/60 uppercase tracking-wider block truncate">
            Response Rate
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {data.responseRate > 0 ? `${data.responseRate}%` : "—"}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-4 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-blue-200/60 uppercase tracking-wider block truncate">
            Active Sessions
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {data.activeSessions}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-4 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-blue-200/60 uppercase tracking-wider block truncate">
            Evaluated Faculty
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {data.evaluatedFacultyCount}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-4 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-blue-200/60 uppercase tracking-wider block truncate">
            Evaluated Subjects
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {data.evaluatedSubjectsCount}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-4 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-blue-200/60 uppercase tracking-wider block truncate">
            Academic Year
          </span>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-2 truncate">
            {data.academicYear}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            title: "Faculty Performance",
            desc: "Individual & department faculty ratings",
            icon: Users,
            path: `${basePath}/faculty-performance`
          },
          {
            title: "Subject Performance",
            desc: "Course coverage & parameter metrics",
            icon: BookOpen,
            path: `${basePath}/subject-performance`
          },
          {
            title: "Feedback Trends",
            desc: "Semester & multi-year historical analysis",
            icon: TrendingUp,
            path: `${basePath}/trends`
          },
          {
            title: "Reports & Dossiers",
            desc: "Consolidated NAAC/NBA export files",
            icon: BarChart3,
            path: `${basePath}/reports`
          }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="bg-white dark:bg-[#0D1B3E] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 flex items-center justify-center mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-blue-200/60 mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-end text-[#0B3D91] dark:text-blue-400">
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dean Institute Department Benchmarking (Dean Only) or HOD Overview */}
      {isDean ? (
        <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Departmental Comparative Overview
                </h2>
                <p className="text-xs text-slate-500 dark:text-blue-200/60">
                  Institute-wide feedback score rankings across academic units
                </p>
              </div>
            </div>
          </div>

          {!data.departmentRankings || data.departmentRankings.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs text-slate-500">
              {emptyStateMsg}
            </div>
          ) : (
            <div className="space-y-3">
              {data.departmentRankings.map((dept) => (
                <div
                  key={dept.name}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {dept.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-blue-200/60 mt-0.5">
                      Response Rate: {dept.responseRate}%
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm font-bold text-[#0B3D91] dark:text-blue-400">
                      <Star className="fill-amber-400 text-amber-400 w-4 h-4" />
                      <span>{dept.score.toFixed(1)} / 5.0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Department Data Visibility &amp; Anonymity Guard
                </h2>
                <p className="text-xs text-slate-500 dark:text-blue-200/60">
                  Data access is strictly scoped to {data.scopeName}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            As Head of Department, you can review aggregated feedback, subject scores, and department rankings. Individual student roll numbers, email addresses, and un-aggregated identities are strictly omitted to maintain statutory anonymous student privacy.
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanHodDashboard;
