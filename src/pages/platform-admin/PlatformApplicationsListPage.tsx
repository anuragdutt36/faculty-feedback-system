import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import {
  FileCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Inbox,
  Trash2
} from "lucide-react";
import { platformService } from "../../services/platform.service.js";
import { InstitutionApplicationItem } from "../../types/platform.js";
import { useTheme } from "../../context/ThemeContext.js";

export const PlatformApplicationsListPage: React.FC = () => {
  const { dark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "ALL";

  const [applications, setApplications] = useState<InstitutionApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>(statusParam);

  const loadApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformService.getApplications({
        status: activeTab === "ALL" ? undefined : activeTab,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      if (res && res.success) {
        setApplications(res.data.applications);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load institution applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(statusParam);
    setPage(1);
  }, [statusParam]);

  useEffect(() => {
    loadApplications();
  }, [page, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    if (tab === "ALL") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", tab);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadApplications();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;
    try {
      setLoading(true);
      const res = await platformService.deleteApplication(id);
      if (res.success) {
        loadApplications();
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete application");
      setLoading(false);
    }
  };

  const tabs = [
    { label: "All Applications", value: "ALL" },
    { label: "Pending Verification", value: "PENDING" },
    { label: "Under Review", value: "UNDER_REVIEW" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Institution Onboarding
            </span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
            {statusParam === "PENDING"
              ? "Pending Verification Applications"
              : statusParam === "UNDER_REVIEW"
              ? "Under Review Applications"
              : statusParam === "APPROVED"
              ? "Approved Applications"
              : statusParam === "REJECTED"
              ? "Rejected Applications"
              : "All Institution Applications"}
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Review college registrations, verify institutional legitimacy, and provision isolated tenant portals
          </p>
        </div>

        <button
          onClick={loadApplications}
          disabled={loading}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 self-start sm:self-auto cursor-pointer ${
            dark
              ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700/60"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div
        className={`rounded-2xl p-4 space-y-4 border transition-all ${
          dark ? "bg-[#0B1528] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
        }`}
      >

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Institution Name, Reference ID (FF-2026-XXXX), Email, City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                dark
                  ? "bg-slate-900 border-slate-700/80 text-slate-100"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              dark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
            }`}
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Applications Table */}
      <div
        className={`rounded-2xl p-5 sm:p-6 border transition-all ${
          dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#0B3D91]/30 border-t-[#0B3D91] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading institution applications...</p>
          </div>
        ) : applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b pb-2 ${dark ? "text-slate-400 border-slate-800/60" : "text-slate-500 border-slate-200"}`}>
                  <th className="pb-3 font-semibold">Ref ID</th>
                  <th className="pb-3 font-semibold">Institution Name</th>
                  <th className="pb-3 font-semibold">Type &amp; Location</th>
                  <th className="pb-3 font-semibold">Representative</th>
                  <th className="pb-3 font-semibold">Email Signal</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-800/40" : "divide-slate-100"}`}>
                {applications.map((app) => (
                  <tr
                    key={app._id}
                    className={`transition-colors ${dark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}`}
                  >
                    <td className="py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {app.referenceId}
                    </td>
                    <td className="py-3.5">
                      <div
                        className={`font-semibold max-w-xs truncate flex items-center gap-1.5 ${dark ? "text-slate-100" : "text-slate-900"}`}
                        title={app.institutionName}
                      >
                        <span className="truncate">{app.institutionName}</span>
                        {(app as any).isUnverifiedManualEntry && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-bold shrink-0">
                            Manual Entry
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] truncate max-w-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {app.officialWebsite}
                      </div>
                    </td>
                    <td className={`py-3.5 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                      <div>{app.institutionType}</div>
                      <div className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {app.city}, {app.state}
                      </div>
                    </td>
                    <td className={`py-3.5 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                      <div className={`font-medium ${dark ? "text-slate-200" : "text-slate-900"}`}>{app.representativeName}</div>
                      <div className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{app.representativeEmail}</div>
                    </td>
                    <td className="py-3.5">
                      {app.domainMatchVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Domain Match</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                          <span>Manual Check</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          app.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : app.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : app.status === "UNDER_REVIEW"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        }`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/platform-admin/applications/${app._id}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            dark
                              ? "bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/30"
                              : "bg-blue-50 hover:bg-[#0B3D91] text-[#0B3D91] hover:text-white border-blue-200"
                          }`}
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(app._id)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                            dark
                              ? "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20"
                              : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-red-200"
                          }`}
                          title="Delete Application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className={`text-xs font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>
              No applications found in this queue.
            </p>
            <p className={`text-[11px] mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Applications submitted by institutions will appear here for verification.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between pt-4 border-t mt-4 text-xs ${dark ? "border-slate-800/80 text-slate-400" : "border-slate-100 text-slate-500"}`}>
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className={`px-3 py-1 rounded-lg disabled:opacity-40 cursor-pointer ${
                  dark ? "bg-slate-800 hover:bg-slate-750 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className={`px-3 py-1 rounded-lg disabled:opacity-40 cursor-pointer ${
                  dark ? "bg-slate-800 hover:bg-slate-750 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformApplicationsListPage;
