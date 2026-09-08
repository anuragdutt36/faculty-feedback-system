import React, { useState, useEffect } from "react";
import { RefreshCw, Mail, CheckCircle2 } from "lucide-react";
import { platformService } from "../../services/platform.service.js";
import { NotificationLogItem } from "../../types/platform.js";
import { useTheme } from "../../context/ThemeContext.js";

export const PlatformNotificationLogsPage: React.FC = () => {
  const { dark } = useTheme();
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformService.getNotificationLogs({ page, limit: 20 });
      if (res && res.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load notification logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Communication &amp; Delivery
            </span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
            Email &amp; Notification Logs
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Audit history of transactional emails, approvals, and activation invitations
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
          <span>Refresh</span>
        </button>
      </div>

      <div
        className={`rounded-2xl p-5 sm:p-6 border transition-all ${
          dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#0B3D91]/30 border-t-[#0B3D91] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading notification logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b pb-2 ${dark ? "text-slate-400 border-slate-800/60" : "text-slate-500 border-slate-200"}`}>
                  <th className="pb-3 font-semibold">Sent At</th>
                  <th className="pb-3 font-semibold">Recipient</th>
                  <th className="pb-3 font-semibold">Notification Type</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-800/40" : "divide-slate-100"}`}>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className={`transition-colors ${dark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}`}
                  >
                    <td className={`py-3 font-mono whitespace-nowrap ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                    <td className={`py-3 font-medium ${dark ? "text-slate-200" : "text-slate-900"}`}>
                      {log.recipientEmail}
                    </td>
                    <td className={`py-3 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono ${
                          dark ? "bg-slate-800 text-blue-300" : "bg-slate-100 text-[#0B3D91]"
                        }`}
                      >
                        {log.notificationType}
                      </span>
                    </td>
                    <td className={`py-3 max-w-sm truncate ${dark ? "text-slate-300" : "text-slate-700"}`} title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          log.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : log.status === "mock_sent"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        }`}
                      >
                        {log.status === "sent" && <CheckCircle2 className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <Mail className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className={`text-xs font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>
              No notification logs recorded yet.
            </p>
          </div>
        )}

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

export default PlatformNotificationLogsPage;
