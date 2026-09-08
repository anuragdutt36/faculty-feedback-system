import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Star,
  Users,
  Calendar,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  FileText,
  ChevronRight,
  Sparkles,
  Loader2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { apiFetch } from "../../services/api.js";
import { FacultyPerformanceReport, ReportData } from "./FacultyPerformanceReport.js";

interface FeedbackRecord {
  id: string;
  subjectName: string;
  subjectCode: string;
  semester: string;
  academicYear: string;
  sessionName: string;
  responseCount: number;
  overallScore: number;
  status: "published" | "closed" | "active";
  reportData: ReportData;
}

interface FacultyStats {
  academicSession: string;
  totalSessions: number;
  subjectsCount: number;
  overallScore: number;
  totalResponses: number;
  latestPeriod: string;
}

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { systemName } = useSettings();
  const navigate = useNavigate();

  const [stats, setStats] = useState<FacultyStats>({
    academicSession: "2025–26",
    totalSessions: 0,
    subjectsCount: 0,
    overallScore: 0,
    totalResponses: 0,
    latestPeriod: "Spring 2026"
  });

  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalData, setActiveModalData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const res = await apiFetch("/reports/faculty/me");
        if (res?.success && res.data) {
          setStats({
            academicSession: res.data.academicSession || "2025–26",
            totalSessions: res.data.totalSessions || 0,
            subjectsCount: res.data.subjectsCount || 0,
            overallScore: res.data.overallScore || 0,
            totalResponses: res.data.totalResponses || 0,
            latestPeriod: res.data.latestPeriod || "Current Term"
          });
          if (Array.isArray(res.data.records)) {
            setRecords(res.data.records);
          }
        }
      } catch (err) {
        console.error("Failed to load faculty feedback data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#041030] to-[#0B3D91] p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-2 backdrop-blur-sm border border-white/10">
              <Calendar size={12} />
              <span>Academic Session {stats.academicSession}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome, {user?.name || "Professor"}
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              Access your aggregated student feedback metrics, course evaluation reports, and pedagogical performance insights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/faculty/my-feedback")}
              className="px-4 py-2.5 rounded-xl bg-white text-[#0B3D91] hover:bg-blue-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Full Feedback Dossier</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-5 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-blue-200/60 uppercase tracking-wider">
              Overall Score
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
              <span>{stats.overallScore > 0 ? stats.overallScore.toFixed(1) : "—"}</span>
              <span className="text-xs font-medium text-slate-500">/ 5.0</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Star size={20} />
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-5 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-blue-200/60 uppercase tracking-wider">
              Assigned &amp; Evaluated Courses
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.subjectsCount}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-5 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-blue-200/60 uppercase tracking-wider">
              Student Responses
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.totalResponses}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] p-5 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-blue-200/60 uppercase tracking-wider">
              Latest Period
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 truncate max-w-[130px]" title={stats.latestPeriod}>
              {stats.latestPeriod}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* Main Feedback Status & Records Section */}
      <div className="rounded-2xl bg-white dark:bg-[#0D1B3E] border border-slate-200/80 dark:border-white/10 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Course Feedback &amp; Evaluation Results
              </h2>
              <p className="text-xs text-slate-500 dark:text-blue-200/60">
                Live aggregated student evaluation results for your assigned courses
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/faculty/my-feedback")}
            className="text-xs font-semibold text-[#0B3D91] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({records.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B3D91]" />
            <p className="text-xs text-slate-500 mt-2">Loading feedback records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No feedback results are available yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Evaluation results will be published here automatically as soon as students submit their feedback.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-slate-50/60 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 p-4.5 hover:border-[#0B3D91]/40 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                      {record.semester} &nbsp;·&nbsp; {record.academicYear}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {record.overallScore > 0 ? record.overallScore.toFixed(1) : "—"}
                      </strong>{" "}
                      / 5.0
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                    {record.subjectName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-blue-200/60 mt-0.5">
                    Code: <span className="font-mono">{record.subjectCode}</span> &nbsp;•&nbsp; Session: {record.sessionName}
                  </p>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 font-medium">
                      <Users size={12} className="text-slate-400" />
                      {record.responseCount} Student {record.responseCount === 1 ? "Response" : "Responses"}
                    </span>
                    <span className="capitalize text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {record.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalData(record.reportData)}
                  className="mt-4 w-full py-2 px-3 rounded-lg bg-white dark:bg-white/10 hover:bg-[#0B3D91] hover:text-white dark:hover:bg-blue-600 text-slate-800 dark:text-white text-xs font-semibold border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText size={13} />
                  <span>View Detailed Report</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Security and Anonymity Guarantee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Cryptographic Anonymity Enforced
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-blue-200/70 mt-0.5 leading-relaxed">
                Individual student identities, roll numbers, and timestamps are not exposed under any circumstance.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-[#0B3D91] dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                NAAC &amp; Quality Parameters
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-blue-200/70 mt-0.5 leading-relaxed">
                Evaluation metrics conform to standard institutional quality assurance rubrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Report Modal */}
      {activeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <FacultyPerformanceReport
              data={activeModalData}
              onClose={() => setActiveModalData(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
