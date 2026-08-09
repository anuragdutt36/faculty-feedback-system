import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Download, Share2, BarChart2, Loader2, Star, Eye } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import {
  ModHeader, ModSearchBar, ModTable, ModTd,
  ModBtn, ModStatusBadge, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { AcademicSessionDropdown } from "../../components/common/AcademicSessionDropdown.js";
import { academicService } from "../../services/academic.service.js";
import { facultyService } from "../../services/faculty.service.js";
import { sessionService } from "../../services/session.service.js";
import { reportService } from "../../services/report.service.js";
import { mappingService } from "../../services/mapping.service.js";

export const Reports: React.FC = () => {
  const { dark } = useTheme();
  const [searchParams] = useSearchParams();

  // Tab selection (4 simplified operational report tabs)
  const types = ["Individual Faculty Report", "Consolidated Class Report", "Department Report", "Trend Report"];
  const [reportType, setReportType] = useState(searchParams.get("type") || "Individual Faculty Report");

  // Selections
  const [selectedYear, setSelectedYear] = useState("2026-27");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("3");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedSession, setSelectedSession] = useState("");

  // Loaded database objects from Academic Structure & System collections
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);

  // Dynamic faculty list with responseCount >= 1 for Individual Faculty Report
  const [availableFaculties, setAvailableFaculties] = useState<any[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);

  // Generated report data state
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [consolidatedData, setConsolidatedData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";
  const inputCls = dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]";

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Reset page, faculty selection, and report data when filters or tabs change
  useEffect(() => {
    setPage(1);
    setSelectedFaculty("");
    setReportData(null);
  }, [reportType, selectedYear, selectedCourse, selectedBranch, selectedSemester, selectedSession, search]);

  const loadFilterData = async () => {
    try {
      const [crsRes, brnRes, mapRes, sessRes, facRes] = await Promise.allSettled([
        academicService.getCourses(),
        academicService.getBranches(),
        mappingService.getMappings(),
        sessionService.getSessions(),
        facultyService.getFacultyList(),
      ]);

      if (crsRes.status === "fulfilled" && crsRes.value?.success) {
        const loadedCourses = crsRes.value.data || [];
        setCourses(loadedCourses);
        if (loadedCourses.length > 0 && !selectedCourse) {
          setSelectedCourse(loadedCourses[0]._id);
        }
      }
      if (brnRes.status === "fulfilled" && brnRes.value?.success) {
        setBranches(brnRes.value.data || []);
      }
      if (mapRes.status === "fulfilled" && mapRes.value?.success) {
        setMappings(mapRes.value.data || []);
      }
      if (sessRes.status === "fulfilled" && sessRes.value?.success) {
        setSessions(sessRes.value.data || []);
      }
      if (facRes.status === "fulfilled" && facRes.value?.success) {
        setFaculties(facRes.value.data || []);
      }
    } catch (err: any) {
      console.error("Filter parameters load error:", err);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  // Ensure course is selected
  useEffect(() => {
    if (courses.length > 0) {
      const isCurrentValid = courses.some(c => String(c._id) === String(selectedCourse));
      if (!selectedCourse || !isCurrentValid) {
        setSelectedCourse(courses[0]._id);
      }
    }
  }, [courses]);

  // Filter Branches by selected Course directly from Academic Structure
  const filteredBranches = React.useMemo(() => {
    if (!selectedCourse) return branches;
    return branches.filter(b => {
      const bCourseId = String(b.courseId?._id || b.courseId || "");
      return bCourseId === String(selectedCourse);
    });
  }, [branches, selectedCourse]);

  // Auto-select first branch when course changes
  useEffect(() => {
    if (filteredBranches.length > 0) {
      const isCurrentValid = filteredBranches.some(b => String(b._id) === String(selectedBranch));
      if (!selectedBranch || !isCurrentValid) {
        setSelectedBranch(filteredBranches[0]._id);
      }
    } else {
      setSelectedBranch("");
    }
  }, [selectedCourse, filteredBranches]);

  // Matching Feedback Sessions
  const matchingSessions = React.useMemo(() => {
    return sessions.filter(s => {
      const sCourseId = String(s.courseId?._id || s.courseId || "");
      const sBranchId = String(s.branchId?._id || s.branchId || "");
      const sSemester = String(s.semester || "");
      const sYear = String(s.academicYear || "");

      const courseMatch = !selectedCourse || sCourseId === String(selectedCourse);
      const branchMatch = !selectedBranch || sBranchId === String(selectedBranch);
      const semMatch = !selectedSemester || sSemester === String(selectedSemester);
      const yearMatch = !selectedYear || sYear === String(selectedYear);

      return courseMatch && branchMatch && semMatch && yearMatch;
    });
  }, [sessions, selectedCourse, selectedBranch, selectedSemester, selectedYear]);

  // Update selected feedback session when matching sessions change
  useEffect(() => {
    if (matchingSessions.length > 0) {
      const isCurrentValid = matchingSessions.some(s => String(s._id) === String(selectedSession));
      if (!selectedSession || !isCurrentValid) {
        setSelectedSession(matchingSessions[0]._id);
      }
    } else {
      setSelectedSession("");
    }
  }, [matchingSessions]);

  // Dynamically load faculty with responseCount >= 1 for the selected session
  useEffect(() => {
    const fetchEligibleFaculties = async () => {
      if (!selectedSession) {
        setAvailableFaculties([]);
        return;
      }
      setLoadingFaculties(true);
      try {
        const res = await reportService.getConsolidatedReport(selectedSession);
        if (res?.success && res.data?.records) {
          const facMap = new Map<string, any>();
          res.data.records.forEach((r: any) => {
            if (r.responseCount >= 1 && r.facultyId) {
              const facId = String(r.facultyId._id || r.facultyId);
              if (!facMap.has(facId)) {
                facMap.set(facId, {
                  _id: facId,
                  name: r.facultyName,
                  designation: r.facultyDesignation,
                  responseCount: r.responseCount,
                  averageRating: r.averageRating,
                });
              }
            }
          });
          setAvailableFaculties(Array.from(facMap.values()));
        } else {
          setAvailableFaculties([]);
        }
      } catch (err) {
        console.error("Failed to load faculties for session:", err);
        setAvailableFaculties([]);
      } finally {
        setLoadingFaculties(false);
      }
    };

    if (reportType === "Individual Faculty Report" && selectedSession) {
      fetchEligibleFaculties();
    } else {
      setAvailableFaculties([]);
    }
  }, [selectedSession, reportType]);

  // Generate Report
  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    setConsolidatedData([]);

    try {
      if (reportType === "Individual Faculty Report") {
        if (!selectedSession) {
          showNotification("error", "No feedback session matches the selected filters.");
          setLoading(false);
          return;
        }
        if (!selectedFaculty) {
          showNotification("error", "Please select a faculty member to generate report.");
          setLoading(false);
          return;
        }
        const res = await reportService.getIndividualReport(selectedFaculty, selectedSession);
        if (res?.success) {
          setReportData(res.data);
          showNotification("success", "Individual faculty report generated successfully!");
        }
      } else if (reportType === "Consolidated Class Report") {
        if (!selectedSession) {
          showNotification("error", "No feedback session matches the selected filters.");
          setLoading(false);
          return;
        }
        const res = await reportService.getConsolidatedReport(selectedSession);
        if (res?.success) {
          setConsolidatedData(res.data?.records || []);
          setReportData(res.data);
          showNotification("success", "Consolidated class report generated successfully!");
        }
      } else if (reportType === "Department Report") {
        if (!selectedBranch) {
          showNotification("error", "Please select a branch.");
          setLoading(false);
          return;
        }
        if (!selectedSession) {
          showNotification("error", "No feedback session matches the selected filters.");
          setLoading(false);
          return;
        }
        const res = await reportService.getDepartmentReport(selectedBranch, selectedSession);
        if (res?.success) {
          setReportData(res.data);
          showNotification("success", "Department performance report generated successfully!");
        }
      } else if (reportType === "Trend Report") {
        if (!selectedCourse || !selectedBranch) {
          showNotification("error", "Please select Course and Branch.");
          setLoading(false);
          return;
        }
        const res = await reportService.getTrendReport(selectedCourse, selectedBranch);
        if (res?.success) {
          setReportData(res.data);
          showNotification("success", "Historical trend report generated successfully!");
        }
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  // Binary PDF Download / Export
  const handleExportPDF = async () => {
    if (!selectedSession && reportType !== "Trend Report") {
      showNotification("error", "No active session selected.");
      return;
    }
    try {
      if (reportType === "Individual Faculty Report") {
        if (!selectedFaculty) {
          showNotification("error", "Please select a faculty member first.");
          return;
        }
        showNotification("success", "Generating faculty PDF report...");
        await reportService.downloadIndividualReport(selectedFaculty, selectedSession, "pdf");
      } else {
        showNotification("success", "Generating class PDF report...");
        await reportService.downloadConsolidatedReport(selectedSession, "pdf");
      }
    } catch (err: any) {
      showNotification("error", "Failed to generate PDF download.");
    }
  };

  // Binary Excel Download / Export CSV
  const handleExportExcel = async () => {
    if (!selectedSession && reportType !== "Trend Report") {
      showNotification("error", "No active session selected.");
      return;
    }
    try {
      if (reportType === "Individual Faculty Report") {
        if (!selectedFaculty) {
          showNotification("error", "Please select a faculty member first.");
          return;
        }
        showNotification("success", "Generating faculty Excel workbook...");
        await reportService.downloadIndividualReport(selectedFaculty, selectedSession, "excel");
      } else {
        showNotification("success", "Generating class Excel workbook...");
        await reportService.downloadConsolidatedReport(selectedSession, "excel");
      }
    } catch (err: any) {
      showNotification("error", "Failed to generate Excel download.");
    }
  };

  // Copy shareable link
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/admin/reports?session=${selectedSession}&fac=${selectedFaculty}&type=${encodeURIComponent(reportType)}`;
    navigator.clipboard.writeText(shareUrl);
    showNotification("success", "Shareable report link copied to clipboard!");
  };

  const getScoreGrade = (score: number) => {
    if (score >= 4.5) return { grade: "O", desc: "Outstanding", color: "text-emerald-500" };
    if (score >= 4.0) return { grade: "A+", desc: "Very Good", color: "text-blue-500" };
    if (score >= 3.5) return { grade: "A", desc: "Good", color: "text-[#0B3D91] dark:text-blue-300" };
    return { grade: "B", desc: "Satisfactory", color: "text-amber-500" };
  };

  const getStrengthsAndWeaknesses = (questionsList: any[]) => {
    if (!questionsList || questionsList.length === 0) return { strengths: [], improvements: [] };
    const sorted = [...questionsList].sort((a, b) => b.average - a.average);
    const strengths = sorted.slice(0, 2).filter(q => q.average >= 3.0);
    const improvements = [...questionsList].sort((a, b) => a.average - b.average).slice(0, 2).filter(q => q.average < 4.5);
    return { strengths, improvements };
  };

  return (
    <div className="space-y-4">
      <ModHeader title="Reports" sub="Generate and export student feedback evaluations" dark={dark}>
        <ModBtn icon={Download} variant="primary" onClick={handleExportPDF} disabled={!reportData}>Export PDF</ModBtn>
        <ModBtn icon={Download} variant="outline" onClick={handleExportExcel} disabled={!reportData}>Export Excel</ModBtn>
        <ModBtn icon={Share2} variant="outline" onClick={handleShare} disabled={!reportData}>Share</ModBtn>
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

      {/* Report Type tabs - 4 Evenly Spaced Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {types.map(t => (
          <button
            key={t}
            onClick={() => {
              setReportType(t);
              setReportData(null);
              setConsolidatedData([]);
            }}
            className={cn(
              "w-full text-center px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
              reportType === t
                ? "bg-[#0B3D91] border-[#0B3D91] text-white"
                : dark
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/8"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dynamic Filters Configuration */}
      <div className={cn("rounded-2xl border p-4 flex flex-wrap gap-3 sm:gap-4 items-end", cardBg)}>
        <div className="w-full sm:w-auto">
          <label className={cn("block text-[10px] font-bold mb-1.5 uppercase tracking-wider", textSub)}>Academic Session</label>
          <AcademicSessionDropdown
            className="w-full sm:w-32"
            value={selectedYear}
            onChange={(val) => setSelectedYear(val)}
          />
        </div>

        <div className="w-full sm:w-auto flex-1 min-w-[140px]">
          <label className={cn("block text-[10px] font-bold mb-1.5 uppercase tracking-wider", textSub)}>Course</label>
          <select
            className={cn("w-full px-3 py-2 rounded-xl border text-xs focus:outline-none cursor-pointer", inputCls)}
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="w-full sm:w-auto flex-1 min-w-[140px]">
          <label className={cn("block text-[10px] font-bold mb-1.5 uppercase tracking-wider", textSub)}>Branch / Dept</label>
          <select
            className={cn("w-full px-3 py-2 rounded-xl border text-xs focus:outline-none cursor-pointer", inputCls)}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {filteredBranches.length === 0 ? (
              <option value="">No Branches</option>
            ) : (
              filteredBranches.map(b => (
                <option key={b._id} value={b._id}>
                  {b.code} ({b.name})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label className={cn("block text-[10px] font-bold mb-1.5 uppercase tracking-wider", textSub)}>Semester</label>
          <select
            className={cn("w-full sm:w-auto px-3 py-2 rounded-xl border text-xs focus:outline-none cursor-pointer", inputCls)}
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s.toString()}>
                Sem {s}
              </option>
            ))}
          </select>
        </div>

        {reportType === "Individual Faculty Report" && (
          <div className="w-full sm:w-auto flex-1 min-w-[200px]">
            <label className={cn("block text-[10px] font-bold mb-1.5 uppercase tracking-wider", textSub)}>Faculty Member</label>
            <select
              className={cn("w-full px-3 py-2 rounded-xl border text-xs focus:outline-none cursor-pointer", inputCls)}
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              disabled={loadingFaculties || !selectedSession || availableFaculties.length === 0}
            >
              <option value="">
                {loadingFaculties
                  ? "Loading faculty..."
                  : availableFaculties.length === 0
                  ? "No faculty with responses"
                  : "-- Select Faculty Member --"}
              </option>
              {availableFaculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.responseCount} Responses)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="w-full sm:w-auto pt-1">
          <ModBtn icon={BarChart2} variant="primary" onClick={handleGenerateReport} disabled={loading}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : "Generate Report"}
          </ModBtn>
        </div>
      </div>

      {/* Feedback session & validation checks for Individual Faculty Report */}
      {reportType === "Individual Faculty Report" ? (
        <>
          {!selectedSession && (
            <div className={cn("p-5 rounded-2xl border text-center text-xs font-semibold", cardBg)}>
              <span className="text-amber-500">No active feedback session matches this Course, Branch, and Semester combination in academic year {selectedYear}.</span>
            </div>
          )}

          {selectedSession && !loadingFaculties && availableFaculties.length === 0 && (
            <div className={cn("p-5 rounded-2xl border text-center text-xs font-semibold", cardBg)}>
              <span className="text-amber-500">No faculty with submitted feedback found for the selected Course, Branch, and Semester.</span>
            </div>
          )}

          {selectedSession && availableFaculties.length > 0 && !selectedFaculty && !reportData && !loading && (
            <div className={cn("p-12 rounded-2xl border text-center text-xs font-medium text-gray-400", cardBg)}>
              Select Course, Branch, Semester, and Faculty to generate an individual faculty report.
            </div>
          )}
        </>
      ) : (
        <>
          {!selectedSession && reportType !== "Trend Report" && (
            <div className={cn("p-5 rounded-2xl border text-center text-xs font-semibold", cardBg)}>
              <span className="text-amber-500">No active feedback session matches this Course, Branch, and Semester combination in academic year {selectedYear}.</span>
            </div>
          )}

          {(selectedSession || reportType === "Trend Report") && !reportData && !loading && (
            <div className={cn("p-12 rounded-2xl border text-center text-xs font-medium text-gray-400", cardBg)}>
              Click "Generate Report" above to compile MERN analysis data from database.
            </div>
          )}
        </>
      )}

      {/* Individual Faculty Report Render */}
      {reportType === "Individual Faculty Report" && reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className={cn("rounded-2xl border p-5 flex flex-col justify-between h-fit", cardBg)}>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-[#0B3D91] flex items-center justify-center text-white text-xl font-bold mb-4 uppercase">
                {reportData.faculty?.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
              </div>
              <h3 className={cn("font-extrabold text-base mb-0.5", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{reportData.faculty?.name}</h3>
              <p className="text-[10px] text-gray-400 font-semibold mb-4 uppercase tracking-wider">{reportData.faculty?.designation}</p>
              
              <div className="space-y-2 border-t pt-3" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
                {[
                  ["Academic Session", reportData.session?.academicYear || selectedYear],
                  ["Total Responses", `${reportData.responseCount} Students`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center text-xs">
                    <span className={textSub}>{label}</span>
                    <span className={cn("font-bold", textPrimary)}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Satisfaction KPI */}
            <div className={cn("mt-6 p-4 rounded-2xl text-center border", dark ? "bg-white/5 border-white/8" : "bg-[#F8FAFD] border-[#0B3D91]/8")}>
              <div className="text-4xl font-extrabold text-[#0B3D91] dark:text-blue-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {reportData.overallAverage} ★
              </div>
              <p className={cn("text-[10px] font-bold mt-0.5 uppercase tracking-wide", textSub)}>Average Score</p>
              <div className={cn("text-xl font-extrabold mt-2", getScoreGrade(reportData.overallAverage).color)}>
                {getScoreGrade(reportData.overallAverage).grade}
              </div>
              <p className="text-[10px] text-gray-400 font-semibold">{getScoreGrade(reportData.overallAverage).desc}</p>
            </div>
          </div>

          {/* Question breakdown lists */}
          <div className={cn("lg:col-span-2 rounded-2xl border p-5 space-y-4", cardBg)}>
            <h4 className={cn("font-bold text-sm mb-2 border-b pb-2", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
              Evaluation Questionnaire Metrics
            </h4>
            <div className="space-y-4">
              {reportData.questionAverages?.map((q: any, idx: number) => (
                <div key={q.questionId} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-start">
                    <span className={cn("font-medium max-w-sm leading-snug", textPrimary)}>{idx + 1}. {q.text}</span>
                    <Badge variant={q.average >= 4.0 ? "success" : "info"}>{q.average} ★</Badge>
                  </div>
                  {/* Progress bar visual indicator */}
                  <div className={cn("h-2 rounded-full w-full overflow-hidden", dark ? "bg-white/10" : "bg-gray-200")}>
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", q.average >= 4.5 ? "bg-emerald-500" : q.average >= 4.0 ? "bg-blue-500" : "bg-amber-500")}
                      style={{ width: `${(q.average / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths & Weaknesses analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-emerald-500">Key Strengths</h5>
                {getStrengthsAndWeaknesses(reportData.questionAverages).strengths.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No clear strengths identified.</p>
                ) : (
                  getStrengthsAndWeaknesses(reportData.questionAverages).strengths.map((q: any, i: number) => (
                    <div key={i} className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
                      {q.text} ({q.average} ★)
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-amber-500">Areas for Improvement</h5>
                {getStrengthsAndWeaknesses(reportData.questionAverages).improvements.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No major areas of concern.</p>
                ) : (
                  getStrengthsAndWeaknesses(reportData.questionAverages).improvements.map((q: any, i: number) => (
                    <div key={i} className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-xl border border-amber-500/20">
                      {q.text} ({q.average} ★)
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Class Report View */}
      {reportType === "Consolidated Class Report" && reportData && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="max-w-md">
            <ModSearchBar dark={dark} placeholder="Search consolidated class results…" search={search} setSearch={setSearch} />
          </div>
          <ModTable
            dark={dark}
            headers={["Faculty Member", "Assigned Subject", "Average Rating", "Responses", "Satisfaction Grade", "Remarks"]}
            totalCount={consolidatedData.length}
            page={page}
            onPageChange={(p) => setPage(p)}
            empty={consolidatedData.length === 0}
          >
            {consolidatedData.filter(r => {
              const query = debouncedSearch.toLowerCase().trim();
              if (!query) return true;
              return r.facultyName?.toLowerCase().includes(query) || r.subjectName?.toLowerCase().includes(query);
            })
            .slice((page - 1) * 10, page * 10)
            .map((r, idx) => {
              const gradeInfo = getScoreGrade(r.averageRating);
              return (
                <tr key={idx} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                  <ModTd><span className={cn("font-bold text-sm", textPrimary)}>{r.facultyName}</span></ModTd>
                  <ModTd>
                    <div className="flex flex-col">
                      <span className={cn("font-semibold", textPrimary)}>{r.subjectName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{r.subjectCode}</span>
                    </div>
                  </ModTd>
                  <ModTd>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className={cn("text-xs", textPrimary)}>{r.averageRating} ★</span>
                    </div>
                  </ModTd>
                  <ModTd><span className={textSub}>{r.responseCount} Responses</span></ModTd>
                  <ModTd><span className={cn("font-extrabold text-base", gradeInfo.color)}>{gradeInfo.grade}</span></ModTd>
                  <ModTd><Badge variant={gradeInfo.grade === "O" || gradeInfo.grade === "A+" ? "success" : "info"}>{gradeInfo.desc}</Badge></ModTd>
                </tr>
              );
            })}
          </ModTable>
        </div>
      )}

      {/* Department Report View */}
      {reportType === "Department Report" && reportData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cn("rounded-2xl p-5 border text-center", cardBg)}>
              <div className="text-4xl font-extrabold text-[#0B3D91] dark:text-blue-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {reportData.deptAverage} ★
              </div>
              <p className={cn("text-[10px] font-bold mt-0.5 uppercase tracking-wide", textSub)}>Department Average Rating</p>
            </div>
            <div className={cn("rounded-2xl p-5 border text-center", cardBg)}>
              <div className="text-4xl font-extrabold text-emerald-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {reportData.participationRate}
              </div>
              <p className={cn("text-[10px] font-bold mt-0.5 uppercase tracking-wide", textSub)}>Participation Rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cn("rounded-2xl p-5 border space-y-3", cardBg)}>
              <h4 className={cn("font-bold text-sm text-emerald-500 border-b pb-2", textPrimary)}>Top Performers</h4>
              {reportData.topPerformers?.length === 0 ? (
                <p className="text-xs text-gray-400">No data available.</p>
              ) : (
                reportData.topPerformers?.map((f: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div>
                      <p className={cn("font-bold", textPrimary)}>{f.name}</p>
                      <p className="text-[10px] text-gray-400">{f.designation}</p>
                    </div>
                    <span className="font-extrabold text-emerald-500">{f.averageRating} ★</span>
                  </div>
                ))
              )}
            </div>
            <div className={cn("rounded-2xl p-5 border space-y-3", cardBg)}>
              <h4 className={cn("font-bold text-sm text-red-500 border-b pb-2", textPrimary)}>Areas for Support</h4>
              {reportData.bottomPerformers?.length === 0 ? (
                <p className="text-xs text-gray-400">No data available.</p>
              ) : (
                reportData.bottomPerformers?.map((f: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div>
                      <p className={cn("font-bold", textPrimary)}>{f.name}</p>
                      <p className="text-[10px] text-gray-400">{f.designation}</p>
                    </div>
                    <span className="font-extrabold text-red-500">{f.averageRating} ★</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trend Report View */}
      {reportType === "Trend Report" && reportData && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h4 className={cn("font-bold text-sm", textPrimary)}>Historical Feedback Trends Overview</h4>
          <ModTable
            dark={dark}
            headers={["Academic Session", "Semester", "Feedback Campaign", "Average Rating", "Participation"]}
            totalCount={reportData.length || 0}
            page={page}
            onPageChange={(p) => setPage(p)}
            empty={!reportData || reportData.length === 0}
          >
            {reportData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-xs text-gray-400">No historical trends available for this branch.</td>
              </tr>
            ) : (
              reportData
                .slice((page - 1) * 10, page * 10)
                .map((r: any, idx: number) => (
                  <tr key={idx} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                    <ModTd><span className={cn("font-bold text-sm", textPrimary)}>{r.academicYear}</span></ModTd>
                    <ModTd><span className={textSub}>Semester {r.semester}</span></ModTd>
                    <ModTd><span className={textSub}>{r.sessionName}</span></ModTd>
                    <ModTd>
                      <div className="flex items-center gap-1.5 font-bold">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <span className={textPrimary}>{r.averageScore} ★</span>
                      </div>
                    </ModTd>
                    <ModTd><span className={textSub}>{r.responseCount} Responses</span></ModTd>
                  </tr>
                ))
            )}
          </ModTable>
        </div>
      )}
    </div>
  );
};

export default Reports;
