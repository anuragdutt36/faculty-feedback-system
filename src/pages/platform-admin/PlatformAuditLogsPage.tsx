import React, { useState, useEffect } from "react";
import { ScrollText, RefreshCw, Filter } from "lucide-react";
import { platformService } from "../../services/platform.service.js";
import { PlatformAuditItem } from "../../types/platform.js";
import { useTheme } from "../../context/ThemeContext.js";

export const PlatformAuditLogsPage: React.FC = () => {
  const { dark } = useTheme();
  const [logs, setLogs] = useState<PlatformAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformService.getAuditLogs({
        page,
        limit: 20,
        severity: filterSeverity || undefined,
        action: filterAction || undefined,
      });
      if (res && res.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, filterSeverity, filterAction]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Platform Governance
            </span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
            Platform Audit Logs
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Immutable record of all platform administrative operations and status changes
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 self-start sm:self-auto cursor-pointer ${
            dark
              ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700/60"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div
        className={`rounded-2xl p-4 flex flex-wrap items-center gap-3 border transition-all ${
          dark ? "bg-[#0B1528] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <div className={`flex items-center gap-2 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
          <Filter className="w-4 h-4" />
          <span>Filter by:</span>
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => {
            setFilterSeverity(e.target.value);
            setPage(1);
          }}
          className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
            dark
              ? "bg-slate-900 border-slate-700/80 text-slate-200"
              : "bg-white border-slate-300 text-slate-900"
          }`}
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
            dark
              ? "bg-slate-900 border-slate-700/80 text-slate-200"
              : "bg-white border-slate-300 text-slate-900"
          }`}
        >
          <option value="">All Actions</option>
          <option value="ADMIN_LOGIN">Admin Login</option>
          <option value="APPLICATION_SUBMITTED">Application Submitted</option>
          <option value="APPLICATION_REVIEWED">Application Reviewed</option>
          <option value="INSTITUTION_APPROVED">Institution Approved</option>
          <option value="INSTITUTION_REJECTED">Institution Rejected</option>
          <option value="INSTITUTION_SUSPENDED">Institution Suspended</option>
          <option value="INSTITUTION_REACTIVATED">Institution Reactivated</option>
        </select>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Table */}
      <div
        className={`rounded-2xl p-5 sm:p-6 border transition-all ${
          dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#0B3D91]/30 border-t-[#0B3D91] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading platform audit logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b pb-2 ${dark ? "text-slate-400 border-slate-800/60" : "text-slate-500 border-slate-200"}`}>
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Operator / Actor</th>
                  <th className="pb-3 font-semibold">Target Entity</th>
                  <th className="pb-3 font-semibold">Details</th>
                  <th className="pb-3 font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-800/40" : "divide-slate-100"}`}>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className={`transition-colors ${dark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}`}
                  >
                    <td className={`py-3 font-mono whitespace-nowrap ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className={`py-3 font-semibold ${dark ? "text-slate-200" : "text-slate-900"}`}>
                      {log.action}
                    </td>
                    <td className={`py-3 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                      {log.platformAdminId ? (
                        <div>
                          <span>{log.platformAdminId.name}</span>
                          <div className={`text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                            {log.platformAdminId.username}
                          </div>
                        </div>
                      ) : (
                        <span className={dark ? "text-slate-400" : "text-slate-500"}>System / Anonymous</span>
                      )}
                    </td>
                    <td className={`py-3 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                      {log.targetInstitutionId ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {log.targetInstitutionId.name} ({log.targetInstitutionId.slug})
                        </span>
                      ) : log.targetApplicationId ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {log.targetApplicationId.referenceId} - {log.targetApplicationId.institutionName}
                        </span>
                      ) : (
                        <span className={dark ? "text-slate-400" : "text-slate-500"}>—</span>
                      )}
                    </td>
                    <td className={`py-3 max-w-xs truncate ${dark ? "text-slate-300" : "text-slate-700"}`} title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          log.severity === "critical"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            : log.severity === "warning"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <ScrollText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className={`text-xs font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>
              No audit logs matching this criteria.
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
                  dark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className={`px-3 py-1 rounded-lg disabled:opacity-40 cursor-pointer ${
                  dark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
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

export default PlatformAuditLogsPage;
