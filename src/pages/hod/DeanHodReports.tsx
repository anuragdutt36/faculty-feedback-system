import React, { useState, useEffect } from "react";
import { BarChart3, Download, FileText, ShieldCheck, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { apiFetch, apiDownload } from "../../services/api.js";
import { reportService } from "../../services/report.service.js";

export const DeanHodReports: React.FC = () => {
  const { user } = useAuth();
  const isDean = user?.role === "dean";

  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await apiFetch("/sessions");
        if (res?.success && Array.isArray(res.data)) {
          setSessions(res.data);
          if (res.data.length > 0) {
            setSelectedSessionId(res.data[0]._id || res.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleExport = async (type: "class-pdf" | "class-excel" | "department") => {
    if (!selectedSessionId) {
      alert("Please select a feedback session to export.");
      return;
    }

    setDownloading(type);
    try {
      if (type === "class-pdf") {
        await reportService.downloadConsolidatedReport(selectedSessionId, "pdf");
      } else if (type === "class-excel") {
        await reportService.downloadConsolidatedReport(selectedSessionId, "excel");
      } else {
        await reportService.downloadConsolidatedReport(selectedSessionId, "excel");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to download report. Please ensure feedback has been submitted for this session.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isDean ? "Dean Academic Reports" : "Department Feedback Reports"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/70 mt-1">
            Download authorized evaluation reports for academic governance, NAAC Criterion II, and statutory audits.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
          <ShieldCheck size={16} />
          <span>Statutory Compliance Ready</span>
        </div>
      </div>

      {/* Session Selector */}
      <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Target Evaluation Session
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-blue-200/60">
              Select an academic evaluation cycle to export
            </p>
          </div>
        </div>

        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91] cursor-pointer"
        >
          {sessions.length === 0 ? (
            <option value="">No feedback sessions found</option>
          ) : (
            sessions.map((s) => (
              <option key={s._id || s.id} value={s._id || s.id}>
                {s.name} ({s.academicYear || "2025-26"})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Consolidated Report PDF */}
        <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 flex items-center justify-center mb-4">
              <FileText size={20} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
              {isDean ? "Institute Consolidated Dossier (PDF)" : "Department Consolidated Dossier (PDF)"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-blue-200/70 leading-relaxed mb-4">
              Formal institutional PDF evaluation report with official headers, faculty averages, and participation metrics.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">PDF Report</span>
            <button
              onClick={() => handleExport("class-pdf")}
              disabled={downloading !== null || !selectedSessionId}
              className="px-3 py-1.5 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {downloading === "class-pdf" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Consolidated Report Excel */}
        <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 size={20} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
              Consolidated Excel Workbook (.xlsx)
            </h3>
            <p className="text-xs text-slate-600 dark:text-blue-200/70 leading-relaxed mb-4">
              Multi-sheet Excel workbook with formatted typography, per-faculty response tallies, and numerical averages for NBA/NAAC audit files.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Excel Workbook</span>
            <button
              onClick={() => handleExport("class-excel")}
              disabled={downloading !== null || !selectedSessionId}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {downloading === "class-excel" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Subject Parameter Matrix */}
        <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <FileText size={20} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
              Curriculum &amp; Pedagogy Matrix
            </h3>
            <p className="text-xs text-slate-600 dark:text-blue-200/70 leading-relaxed mb-4">
              Granular breakdown across criteria: Subject Knowledge, Communication, Pedagogy, and Fairness.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Excel Matrix</span>
            <button
              onClick={() => handleExport("department")}
              disabled={downloading !== null || !selectedSessionId}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {downloading === "department" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Export Matrix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeanHodReports;
