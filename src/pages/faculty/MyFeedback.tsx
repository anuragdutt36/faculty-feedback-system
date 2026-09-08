import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Filter,
  Search,
  Star,
  FileText,
  ChevronRight,
  ShieldCheck,
  Calendar,
  BookOpen
} from "lucide-react";
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

export const MyFeedback: React.FC = () => {
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSem, setSelectedSem] = useState<string>("all");
  const [activeModalData, setActiveModalData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await apiFetch("/reports/faculty/me");
        if (res?.success && Array.isArray(res.data?.records)) {
          setRecords(res.data.records);
        }
      } catch (err) {
        console.error("Failed to fetch feedback records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const academicYears = Array.from(new Set(records.map((r) => r.academicYear))).filter(Boolean);
  const semesters = Array.from(new Set(records.map((r) => r.semester))).filter(Boolean);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sessionName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === "all" || r.academicYear === selectedYear;
    const matchesSem = selectedSem === "all" || r.semester === selectedSem;
    return matchesSearch && matchesYear && matchesSem;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Feedback Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/70 mt-1">
            View aggregated student feedback scores and detailed course reports.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
          <ShieldCheck size={16} />
          <span>Student Anonymity Protected</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject name or code..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Academic Years</option>
            {academicYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Semesters</option>
            {semesters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List or Empty State */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
          <ClipboardList className="w-12 h-12 text-slate-300 dark:text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No feedback results are available yet.
          </h3>
          <p className="text-xs text-slate-500 dark:text-blue-200/60 mt-1 max-w-sm mx-auto">
            Once evaluation sessions close and reports are generated for your assigned subjects, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
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

                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                  {record.subjectName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-blue-200/60 mt-0.5">
                  Code: {record.subjectCode} &nbsp;•&nbsp; Session: {record.sessionName}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{record.responseCount} Student Responses</span>
                  <span className="capitalize text-emerald-600 font-semibold">
                    ● {record.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalData(record.reportData)}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-[#0B3D91] hover:text-white dark:hover:bg-blue-600 text-slate-800 dark:text-white text-xs font-semibold border border-slate-200/70 dark:border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText size={14} />
                <span>View Detailed Report</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal Popup */}
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

export default MyFeedback;
