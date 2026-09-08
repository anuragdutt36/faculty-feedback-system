import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import {
  Building2,
  Search,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Edit2,
  PauseCircle,
  PlayCircle,
  Sliders,
  X,
  AlertCircle,
  Trash2
} from "lucide-react";
import { platformService } from "../../services/platform.service.js";
import { useTheme } from "../../context/ThemeContext.js";

export const PlatformInstitutionsPage: React.FC = () => {
  const { dark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "ALL";

  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(statusParam);

  // Suspend Modal State
  const [selectedInstForSuspend, setSelectedInstForSuspend] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspending, setSuspending] = useState(false);

  // Delete Modal State
  const [selectedInstForDelete, setSelectedInstForDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit Modal State
  const [selectedInstForEdit, setSelectedInstForEdit] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const loadInstitutions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformService.getInstitutions({
        status: activeTab === "ALL" ? undefined : activeTab,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      if (res && res.success) {
        setInstitutions(res.data.institutions);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load institutions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(statusParam);
    setPage(1);
  }, [statusParam]);

  useEffect(() => {
    loadInstitutions();
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
    loadInstitutions();
  };

  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstForSuspend || !suspendReason.trim()) return;

    setSuspending(true);
    try {
      await platformService.suspendInstitution(selectedInstForSuspend._id, suspendReason);
      setSelectedInstForSuspend(null);
      setSuspendReason("");
      loadInstitutions();
    } catch (err: any) {
      setError(err.message || "Failed to suspend institution.");
    } finally {
      setSuspending(false);
    }
  };

  const handleReactivate = async (instId: string) => {
    try {
      await platformService.reactivateInstitution(instId);
      loadInstitutions();
    } catch (err: any) {
      setError(err.message || "Failed to reactivate institution.");
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstForDelete) return;

    setDeleting(true);
    try {
      await platformService.deleteInstitution(selectedInstForDelete._id);
      setSelectedInstForDelete(null);
      loadInstitutions();
    } catch (err: any) {
      setError(err.message || "Failed to delete institution.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEdit = (inst: any) => {
    setSelectedInstForEdit(inst);
    setEditFormData({
      name: inst.name,
      type: inst.type,
      website: inst.website,
      officialEmail: inst.officialEmail,
      city: inst.city || "",
      state: inst.state || "",
      domainRestriction: inst.settings?.domainRestriction || "",
      themeMode: inst.settings?.themeMode || "light",
      accentColor: inst.settings?.accentColor || "#0B3D91",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstForEdit) return;

    setSavingEdit(true);
    try {
      await platformService.updateInstitution(selectedInstForEdit._id, {
        name: editFormData.name,
        type: editFormData.type,
        website: editFormData.website,
        officialEmail: editFormData.officialEmail,
        city: editFormData.city,
        state: editFormData.state,
        settings: {
          ...selectedInstForEdit.settings,
          domainRestriction: editFormData.domainRestriction,
          themeMode: editFormData.themeMode,
          accentColor: editFormData.accentColor,
        },
      });
      setSelectedInstForEdit(null);
      loadInstitutions();
    } catch (err: any) {
      setError(err.message || "Failed to update institution.");
    } finally {
      setSavingEdit(false);
    }
  };

  const tabs = [
    { label: "All Institutions", value: "ALL" },
    { label: "Active Tenants", value: "active" },
    { label: "Suspended", value: "suspended" },
    { label: "Pending", value: "pending" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Platform Directory
            </span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
            {statusParam === "suspended"
              ? "Suspended Institution Tenants"
              : statusParam === "active"
              ? "Approved / Active Institution Directory"
              : "All Institution Directory"}
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Manage provisioned college portals, inspect tenant workload metrics, and govern tenant lifecycle
          </p>
        </div>

        <button
          onClick={loadInstitutions}
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

      {/* Search */}
      <div
        className={`rounded-2xl p-4 space-y-4 border transition-all ${
          dark ? "bg-[#0B1528] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
        }`}
      >

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Institution Name, Slug, Tenant ID (INS-2026-XXXX), City/State..."
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
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Table */}
      <div
        className={`rounded-2xl p-5 sm:p-6 border transition-all ${
          dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#0B3D91]/30 border-t-[#0B3D91] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading institutions directory...</p>
          </div>
        ) : institutions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b pb-2 ${dark ? "text-slate-400 border-slate-800/60" : "text-slate-500 border-slate-200"}`}>
                  <th className="pb-3 font-semibold">Tenant ID &amp; Slug</th>
                  <th className="pb-3 font-semibold">Institution Name</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-center">Sessions</th>
                  <th className="pb-3 font-semibold text-center">Students</th>
                  <th className="pb-3 font-semibold text-center">Faculty</th>
                  <th className="pb-3 font-semibold text-center">Submissions</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-800/40" : "divide-slate-100"}`}>
                {institutions.map((inst) => (
                  <tr
                    key={inst._id}
                    className={`transition-colors ${dark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}`}
                  >
                    <td className="py-3.5 font-mono whitespace-nowrap">
                      <div className="font-bold text-blue-600 dark:text-blue-400">{inst.institutionId}</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">/{inst.slug}</div>
                    </td>
                    <td className="py-3.5">
                      <div
                        className={`font-semibold max-w-xs truncate ${dark ? "text-slate-100" : "text-slate-900"}`}
                        title={inst.name}
                      >
                        {inst.name}
                      </div>
                      <div className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {inst.type} • {inst.city || "N/A"}, {inst.state || "N/A"}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          inst.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : inst.status === "suspended"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {inst.status}
                      </span>
                    </td>
                    <td className={`py-3.5 text-center font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
                      {inst.metrics?.feedbackSessions ?? 0}
                    </td>
                    <td className={`py-3.5 text-center font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
                      {inst.metrics?.studentsEnrolled ?? 0}
                    </td>
                    <td className={`py-3.5 text-center font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
                      {inst.metrics?.facultyMembers ?? 0}
                    </td>
                    <td className="py-3.5 text-center font-semibold text-blue-600 dark:text-blue-400 font-mono">
                      {inst.metrics?.feedbackSubmissions ?? 0}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap space-x-1.5">
                      {/* Preview Portal */}
                      <a
                        href={`/college/${inst.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open Tenant Portal"
                        className={`inline-flex p-1.5 rounded-lg border transition-colors ${
                          dark
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(inst)}
                        title="Edit Institution Configuration"
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          dark
                            ? "bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-blue-500/20"
                            : "bg-blue-50 hover:bg-blue-100 text-[#0B3D91] border-blue-200"
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Suspend / Reactivate */}
                      {inst.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedInstForSuspend(inst)}
                          title="Suspend Tenant Portal"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                        </button>
                      ) : inst.status === "suspended" ? (
                        <button
                          type="button"
                          onClick={() => handleReactivate(inst._id)}
                          title="Reactivate Tenant Portal"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      {/* Delete Institution */}
                      <button
                        type="button"
                        onClick={() => setSelectedInstForDelete(inst)}
                        title="Delete Institution Tenant"
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className={`text-xs font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>
              No institutions found matching criteria.
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

      {/* Suspend Confirmation Modal */}
      {selectedInstForSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div
            className={`border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 ${
              dark ? "bg-[#091124] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 pb-3 border-b border-slate-200 dark:border-slate-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                Suspend Institution Tenant
              </h3>
            </div>

            <p className={`text-xs leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>
              Suspending <strong>{selectedInstForSuspend.name}</strong> will temporarily restrict all active student evaluations and administrator access for this tenant.
            </p>

            <form onSubmit={handleSuspendSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Reason for Suspension <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Statutory compliance audit pending, subscription expired..."
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    dark
                      ? "bg-slate-900 border-slate-700/80 text-slate-100 placeholder-slate-400"
                      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInstForSuspend(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspending}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {suspending ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedInstForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div
            className={`border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 ${
              dark ? "bg-[#091124] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 pb-3 border-b border-slate-200 dark:border-slate-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                Delete Institution Tenant
              </h3>
            </div>

            <p className={`text-xs leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>
              Are you sure you want to permanently delete <strong>{selectedInstForDelete.name}</strong> ({selectedInstForDelete.institutionId})? This will remove the institution tenant from the platform directory.
            </p>

            <form onSubmit={handleDeleteSubmit} className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInstForDelete(null)}
                className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                  dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Confirm Permanent Delete"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Institution Modal */}
      {selectedInstForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div
            className={`border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 ${
              dark ? "bg-[#091124] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0B3D91] dark:text-blue-400" />
                <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                  Edit Tenant Configuration
                </h3>
              </div>
              <button
                onClick={() => setSelectedInstForEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className={`w-full border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                    dark ? "bg-slate-900 border-slate-700/80 text-slate-100" : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                    City
                  </label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className={`w-full border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                      dark ? "bg-slate-900 border-slate-700/80 text-slate-100" : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                    State
                  </label>
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className={`w-full border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                      dark ? "bg-slate-900 border-slate-700/80 text-slate-100" : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Official Website
                </label>
                <input
                  type="text"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  className={`w-full border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                    dark ? "bg-slate-900 border-slate-700/80 text-slate-100" : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Domain Restrictions
                </label>
                <input
                  type="text"
                  value={editFormData.domainRestriction}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, domainRestriction: e.target.value })
                  }
                  placeholder="e.g. knit.ac.in, iitk.ac.in"
                  className={`w-full border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                    dark ? "bg-slate-900 border-slate-700/80 text-slate-100" : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedInstForEdit(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    dark ? "bg-slate-800 text-slate-300 hover:bg-slate-750" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformInstitutionsPage;
