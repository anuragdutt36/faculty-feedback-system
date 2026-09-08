import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Building2,
  FileCheck,
  Clock,
  AlertOctagon,
  XCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Activity,
  CheckCircle2,
  Inbox
} from "lucide-react";
import { platformService } from "../../services/platform.service.js";
import { PlatformDashboardData } from "../../types/platform.js";
import { useTheme } from "../../context/ThemeContext.js";

export const PlatformDashboard: React.FC = () => {
  const { dark } = useTheme();
  const [data, setData] = useState<PlatformDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformService.getDashboardStats();
      if (res && res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load platform dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = data?.stats || {
    totalInstitutions: 0,
    activeInstitutions: 0,
    suspendedInstitutions: 0,
    pendingApplications: 0,
    underReviewApplications: 0,
    rejectedApplications: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-5 sm:p-6 border transition-all ${
          dark
            ? "bg-gradient-to-r from-[#0E1B38] to-[#122347] border-slate-800/80 shadow-xl shadow-black/20 text-white"
            : "bg-white border-slate-200 shadow-xs text-slate-900"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Platform Governance
            </span>
            <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              All Tenants Overview
            </span>
          </div>
          <h1
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              dark ? "text-white" : "text-slate-900"
            }`}
          >
            Platform Executive Dashboard
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Monitor institution onboarding, verification pipeline, tenant health, and governance logs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 cursor-pointer ${
              dark
                ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700/60"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/platform-admin/applications"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Review Applications</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline text-red-500 hover:text-red-700 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Institutions */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
            dark
              ? "bg-[#0B1528] border-slate-800/80 shadow-lg shadow-black/10 text-white"
              : "bg-white border-slate-200 shadow-xs text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Institutions</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
            {stats.totalInstitutions}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Platform-wide tenants</p>
        </div>

        {/* Pending Applications */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
            dark
              ? "bg-[#0B1528] border-slate-800/80 shadow-lg shadow-black/10 text-white"
              : "bg-white border-slate-200 shadow-xs text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {stats.pendingApplications}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Awaiting admin verification</p>
        </div>

        {/* Active Institutions */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
            dark
              ? "bg-[#0B1528] border-slate-800/80 shadow-lg shadow-black/10 text-white"
              : "bg-white border-slate-200 shadow-xs text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Active Tenants</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {stats.activeInstitutions}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Live operational portals</p>
        </div>

        {/* Suspended Institutions */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
            dark
              ? "bg-[#0B1528] border-slate-800/80 shadow-lg shadow-black/10 text-white"
              : "bg-white border-slate-200 shadow-xs text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Suspended</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">
            {stats.suspendedInstitutions}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Temporarily locked portals</p>
        </div>

        {/* Rejected Applications */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all col-span-2 sm:col-span-1 ${
            dark
              ? "bg-[#0B1528] border-slate-800/80 shadow-lg shadow-black/10 text-white"
              : "bg-white border-slate-200 shadow-xs text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 tracking-tight">
            {stats.rejectedApplications}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Declined applications</p>
        </div>
      </div>

      {/* Two Column Layout: Recent Applications & Recent Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 Cols) */}
        <div
          className={`lg:col-span-2 rounded-2xl p-5 sm:p-6 border transition-all flex flex-col ${
            dark
              ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10"
              : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div
            className={`flex items-center justify-between pb-4 border-b mb-4 ${
              dark ? "border-slate-800" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                  Recent Institution Applications
                </h2>
                <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Newly submitted college registrations
                </p>
              </div>
            </div>
            <Link
              to="/platform-admin/applications"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {data?.recentApplications && data.recentApplications.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b pb-2 ${
                      dark ? "text-slate-400 border-slate-800/60" : "text-slate-500 border-slate-200"
                    }`}
                  >
                    <th className="pb-3 font-semibold">Ref ID</th>
                    <th className="pb-3 font-semibold">Institution</th>
                    <th className="pb-3 font-semibold">Representative</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-800/40" : "divide-slate-100"}`}>
                  {data.recentApplications.map((app) => (
                    <tr
                      key={app._id}
                      className={`transition-colors ${
                        dark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {app.referenceId}
                      </td>
                      <td className="py-3">
                        <div className={`font-medium ${dark ? "text-slate-200" : "text-slate-900"}`}>
                          {app.institutionName}
                        </div>
                        <div className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                          {app.city}, {app.state}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className={dark ? "text-slate-300" : "text-slate-700"}>
                          {app.representativeName}
                        </div>
                        <div className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                          {app.representativeEmail}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            app.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : app.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : app.status === "UNDER_REVIEW"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/platform-admin/applications/${app._id}`}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border inline-flex items-center gap-1 transition-all ${
                            dark
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                          }`}
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <Inbox className="w-8 h-8 text-slate-400 mb-2" />
                <p className={`text-xs font-medium ${dark ? "text-slate-300" : "text-slate-600"}`}>
                  No institution applications submitted yet.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Applications submitted via the platform registration page will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Approvals & Active Tenants (1 Col) */}
        <div
          className={`rounded-2xl p-5 sm:p-6 border transition-all flex flex-col ${
            dark
              ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10"
              : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div
            className={`flex items-center justify-between pb-4 border-b mb-4 ${
              dark ? "border-slate-800" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                  Active Tenants
                </h2>
                <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Approved institutions
                </p>
              </div>
            </div>
            <Link
              to="/platform-admin/institutions"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              All
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {data?.recentApprovals && data.recentApprovals.length > 0 ? (
              data.recentApprovals.map((inst) => (
                <div
                  key={inst._id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    dark
                      ? "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          dark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {inst.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-blue-600 dark:text-blue-400">
                        {inst.institutionId}
                      </span>
                      <span>•</span>
                      <span className="truncate">{inst.type}</span>
                    </div>
                  </div>
                  <a
                    href={`/college/${inst.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      dark
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                    title={`Open ${inst.slug} portal`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active tenants loaded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Activity Stream */}
      <div
        className={`rounded-2xl p-5 sm:p-6 border transition-all ${
          dark
            ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10"
            : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <div
          className={`flex items-center justify-between pb-4 border-b mb-4 ${
            dark ? "border-slate-800" : "border-slate-100"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                Recent Platform Activity &amp; Governance Logs
              </h2>
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Real-time audit log stream
              </p>
            </div>
          </div>
          <Link
            to="/platform-admin/audit-logs"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Full Audit Trail</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className={`divide-y ${dark ? "divide-slate-800/60" : "divide-slate-100"}`}>
              {data.recentActivity.map((log) => (
                <div key={log._id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
                          {log.action}
                        </span>
                        {log.platformAdminId && (
                          <span className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                            by {log.platformAdminId.name || log.platformAdminId.username}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        {log.details}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              No recent platform activity logged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
