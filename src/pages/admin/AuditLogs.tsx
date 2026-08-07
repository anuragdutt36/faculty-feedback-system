import React, { useState, useEffect } from "react";
import { Download, RefreshCw, ChevronRight, X, ScrollText, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import {
  ModHeader, ModBtn, ModSearchBar, ModTable,
  ModTd, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { settingsService } from "../../services/settings.service.js";

interface AuditLogItem {
  _id: string;
  userId?: {
    _id: string;
    username: string;
    role: string;
  } | null;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
  module?: string;
  metadata?: any;
}

export const AuditLogs: React.FC = () => {
  const { dark } = useTheme();
  
  // Search & Filter States
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedModule, setSelectedModule] = useState("");

  // Data States
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";
  const inputCls = dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]";

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getAuditLogs();
      if (res?.success) {
        setLogs(res.data || []);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load system audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logs locally
  const getFilteredLogs = () => {
    return logs.filter(l => {
      const matchAction = !selectedAction || l.action === selectedAction;
      const matchRole = !selectedRole || l.userId?.role === selectedRole;
      const matchSeverity = !selectedSeverity || l.severity === selectedSeverity;
      const matchModule = !selectedModule || l.module === selectedModule;
      
      const q = debouncedSearch.toLowerCase().trim();
      const matchSearch = !q ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        (l.userId?.username || "system").toLowerCase().includes(q) ||
        (l.ipAddress || "").toLowerCase().includes(q) ||
        (l.module || "").toLowerCase().includes(q);

      return matchAction && matchRole && matchSeverity && matchModule && matchSearch;
    });
  };

  const filteredLogs = getFilteredLogs();
  const selectedLog = logs.find(l => l._id === selectedLogId);

  // Extract unique actions dynamically
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));
  const uniqueModules = Array.from(new Set(logs.filter(l => l.module).map(l => l.module)));

  // Export logs to CSV
  const handleExport = () => {
    if (filteredLogs.length === 0) {
      showNotification("error", "No logs available to export.");
      return;
    }
    const headers = ["Timestamp", "Username", "Role", "Severity", "Module", "Action", "Description", "IP Address", "User Agent"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(l => [
        `"${new Date(l.timestamp).toLocaleString()}"`,
        `"${l.userId?.username || "System"}"`,
        `"${l.userId?.role || "System"}"`,
        `"${l.severity || "info"}"`,
        `"${l.module || "general"}"`,
        `"${l.action}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.ipAddress || "—"}"`,
        `"${(l.userAgent || "—").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${systemName}_Audit_Logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (sev: string) => {
    if (sev === "error" || sev === "critical") return <Badge variant="danger">{sev === "critical" ? "Critical" : "Error"}</Badge>;
    if (sev === "warning") return <Badge variant="warning">Warning</Badge>;
    return <Badge variant="info">Info</Badge>;
  };

  return (
    <div className="space-y-4">
      <ModHeader title="Audit Logs" sub="Complete tamper-resistant trail of all system administration activities" dark={dark}>
        <ModBtn icon={Download} variant="primary" onClick={handleExport}>Export Logs</ModBtn>
        <ModBtn icon={RefreshCw} variant="outline" onClick={loadData}>Refresh</ModBtn>
      </ModHeader>

      {notification && (
        <div className={cn(
          "p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300",
          notification.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300"
        )}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline cursor-pointer border-0 bg-transparent text-inherit ml-2">Dismiss</button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        <ModSearchBar dark={dark} placeholder="Search user, action, IP..." value={search} onChange={setSearch} />
        
        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer w-full sm:w-auto", dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Actions</option>
          {uniqueActions.map(act => (
            <option key={act} value={act} className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">{act}</option>
          ))}
        </select>

        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Roles</option>
          <option value="admin" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Admin</option>
          <option value="student" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Student</option>
          <option value="hod" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">HOD Coordinator</option>
        </select>

        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Severities</option>
          <option value="info" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Info</option>
          <option value="warning" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Warning</option>
          <option value="critical" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Critical</option>
          <option value="error" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Error</option>
        </select>

        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Modules</option>
          {uniqueModules.filter(Boolean).map(mod => (
            <option key={mod} value={mod} className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">{mod}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Logs Table column */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-transparent">
              <Loader2 size={36} className="animate-spin text-[#0B3D91]" />
              <p className={cn("text-sm mt-3 font-medium", textSub)}>Loading audit trails...</p>
            </div>
          ) : (
            <ModTable
              dark={dark}
              headers={["Timestamp", "User Identity", "Severity", "Module", "Action Name", "IP Address", ""]}
              totalCount={filteredLogs.length}
              empty={filteredLogs.length === 0}
              page={currentPage}
              onPageChange={setCurrentPage}
            >
              {filteredLogs.slice((currentPage - 1) * 10, currentPage * 10).map((l) => (
                <tr
                  key={l._id}
                  onClick={() => setSelectedLogId(l._id)}
                  className={cn(
                    "transition-colors cursor-pointer",
                    l._id === selectedLogId
                      ? (dark ? "bg-white/10" : "bg-[#EEF2F8]")
                      : dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]"
                  )}
                >
                  <ModTd><span className={cn("font-mono text-[10px]", textSub)}>{new Date(l.timestamp).toLocaleString()}</span></ModTd>
                  <ModTd><span className={cn("text-[11px] font-semibold", textPrimary)}>{l.userId?.username || "Anonymous / System"}</span></ModTd>
                  <ModTd>{getSeverityBadge(l.severity)}</ModTd>
                  <ModTd><Badge variant="default">{l.module || "general"}</Badge></ModTd>
                  <ModTd><span className="font-mono text-[#3B82F6] text-[10px] font-semibold">{l.action}</span></ModTd>
                  <ModTd><span className={cn("font-mono", textSub)}>{l.ipAddress || "—"}</span></ModTd>
                  <ModTd><ChevronRight size={12} className={textSub} /></ModTd>
                </tr>
              ))}
            </ModTable>
          )}
        </div>

        {/* Right side Detail Drawer */}
        <div className={cn("rounded-2xl border p-5 h-fit shadow-xs", cardBg)}>
          {selectedLog ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
                <h4 className={cn("font-bold text-sm", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Log Details</h4>
                <button onClick={() => setSelectedLogId(null)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-[#EEF2F8] cursor-pointer border-0 bg-transparent"><X size={14} /></button>
              </div>

              <div className={cn("rounded-xl p-3 font-mono text-[11px] break-words", dark ? "bg-black/20 text-emerald-300" : "bg-[#0D1B3E] text-emerald-400")}>
                <span className="text-blue-300">[{new Date(selectedLog.timestamp).toLocaleString()}]</span><br />
                <span className="text-white">{selectedLog.userId?.username || "System"}</span> → <span className="text-[#3B82F6]">{selectedLog.action}</span><br />
                <p className="text-slate-300 mt-2 whitespace-pre-wrap">{selectedLog.details}</p>
              </div>

              <div className="space-y-2.5">
                {[
                  ["User", selectedLog.userId?.username || "System (Auto-process)"],
                  ["Assigned Role", selectedLog.userId?.role || "System Account"],
                  ["Severity Level", selectedLog.severity?.toUpperCase() || "INFO"],
                  ["Module", selectedLog.module || "general"],
                  ["Action Name", selectedLog.action],
                  ["IP Address", selectedLog.ipAddress || "—"],
                  ["Browser Agent", selectedLog.userAgent || "Internal Client"]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start text-xs py-1.5 border-b last:border-0" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
                    <span className={textSub}>{label}</span>
                    <span className={cn("font-semibold text-right max-w-[150px] break-words", textPrimary)}>{value}</span>
                  </div>
                ))}
              </div>

              {selectedLog.metadata && (
                <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
                  <span className={cn("text-xs font-bold block", textSub)}>Metadata Payload</span>
                  <pre className={cn("rounded-xl p-3 font-mono text-[9px] overflow-auto max-h-[180px] whitespace-pre", dark ? "bg-black/30 text-emerald-400" : "bg-gray-100 text-slate-800")}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScrollText size={28} className={cn("mb-2", textSub)} strokeWidth={1.5} />
              <p className={cn("text-sm font-semibold", textPrimary)}>Select an audit entry</p>
              <p className={cn("text-xs mt-1", textSub)}>Click any row in the list to inspect metadata details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
