import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  GraduationCap, Activity, ClipboardList, CheckCircle2, Calendar, ArrowRight,
  Building2, Clock, MessageSquare, Lock, Sparkles, BarChart2, ShieldCheck, Loader2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useTheme } from "../../context/ThemeContext.js";
import { Badge } from "../../components/common/Badge.js";
import { StatusDot } from "../../components/common/StatusDot.js";
import { PrivacyBanner } from "../../components/common/PrivacyBanner.js";
import { sessionService } from "../../services/session.service.js";
import { studentService } from "../../services/student.service.js";

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();

  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [apiMessage, setApiMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const [sessRes, histRes] = await Promise.allSettled([
        sessionService.getStudentActiveSessions(),
        studentService.getHistory(),
      ]);
      if (sessRes.status === "fulfilled" && sessRes.value?.success) {
        setActiveSessions(sessRes.value.data || []);
        if (sessRes.value.message) {
          setApiMessage(sessRes.value.message);
        }
      }
      if (histRes.status === "fulfilled" && histRes.value?.success) {
        setHistory(histRes.value.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log("[DEBUG] Dashboard route entered. Loading sessions for:", user.username);
      loadSessions();
    }
  }, [user]);

  const safelyFormatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const subjectsList = (activeSessions || []).flatMap(as =>
    (as?.subjects || []).map((s: any) => ({
      mappingId: s?.mappingId,
      sessionId: as?.session?.id || as?.session?._id,
      sessionName: as?.session?.name || "Feedback Session",
      facultyId: s?.faculty?._id,
      faculty: s?.faculty?.name || "Faculty Member",
      subjectId: s?.subject?._id,
      subject: s?.subject?.name || "Subject",
      code: s?.subject?.code || "SUB-000",
      course: s?.courseName || as?.session?.courseName || user?.course || "Master of Computer Applications",
      branch: s?.branchCode || as?.session?.branchCode || user?.branch || "MCA",
      semester: s?.semester || as?.session?.semester || user?.semester || 1,
      year: s?.year || as?.session?.year || user?.year || 1,
      deadline: safelyFormatDate(as?.session?.endDate),
      submitted: Boolean(s?.submitted),
    }))
  );

  const pending = subjectsList.filter((s) => !s.submitted).length;
  const submitted = subjectsList.filter((s) => s.submitted).length;
  const total = subjectsList.length;
  const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;

  const latestSubmission = history.length > 0 ? history[0] : null;
  const lastSubmittedVal = latestSubmission ? latestSubmission.date : "N/A";
  const lastSubmittedSub = latestSubmission ? latestSubmission.subject : "No submissions yet";

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8";

  const getYearLabel = (y?: number) => {
    if (!y) return "1st Year";
    if (y === 1) return "1st Year";
    if (y === 2) return "2nd Year";
    if (y === 3) return "3rd Year";
    return `${y}th Year`;
  };

  const rollNumberDisplay = user?.rollNumber || (user?.username ? user.username.split("@")[0].split(".").pop() : "");

  const studentTags = [
    user?.branch || "MCA",
    getYearLabel(user?.year),
    user?.semester ? `Semester ${user.semester}` : "Semester 2",
    user?.academicSession || "2025-26",
  ].filter(Boolean);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 size={36} className="animate-spin text-[#0B3D91]" />
        <p className="text-sm mt-3 font-medium text-[#5A6E8E]">Loading active feedback sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div
        className={`rounded-2xl p-4 sm:p-6 border shadow-sm ${
          dark ? "border-white/10 bg-white/5" : "border-[#0B3D91]/8 bg-white"
        }`}
        style={{
          background: dark
            ? "linear-gradient(135deg, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.01))"
            : "linear-gradient(135deg, #ffffff 60%, #EEF2F8)"
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`${textSub} text-xs font-semibold uppercase tracking-wider mb-1`}>Welcome back</p>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${textPrimary} mb-1`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {user?.name || "Student"}
            </h1>
            {rollNumberDisplay && (
              <p className="text-xs sm:text-sm font-semibold text-[#0B3D91] dark:text-blue-400 font-mono tracking-wide mb-2.5">
                Roll No: {rollNumberDisplay}
              </p>
            )}
            {user?.course && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">
                {user.course}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {studentTags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    dark ? "bg-white/10 text-white" : "bg-[#EEF2F8] text-[#0B3D91]"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center shrink-0">
            <GraduationCap size={24} className="text-white sm:w-7 sm:h-7" strokeWidth={1.5} />
          </div>
        </div>
        <div className={`mt-5 pt-5 border-t ${dark ? "border-white/10" : "border-[#0B3D91]/8"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${textPrimary}`}>Feedback Progress — Academic Session</span>
            <span className={`text-xs font-bold ${dark ? "text-blue-300" : "text-[#0B3D91]"}`}>{submitted}/{total} submitted</span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-[#EEF2F8]"}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0B3D91] to-[#3B82F6] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#5A6E8E]">
            <span>{pending} pending</span>
            <span>{progress}% complete</span>
          </div>
        </div>
      </div>

      {/* Privacy Banner */}
      <PrivacyBanner />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Sessions", value: String(activeSessions.length), sub: "Active Feedback Campaigns", icon: Activity, color: "bg-[#0B3D91]" },
          { label: "Pending Feedback", value: String(pending), sub: `${pending} subjects remaining`, icon: ClipboardList, color: "bg-amber-500" },
          { label: "Submitted", value: String(submitted), sub: "Completed responses", icon: CheckCircle2, color: "bg-emerald-500" },
          { label: "Last Submitted", value: lastSubmittedVal, sub: lastSubmittedSub, icon: Calendar, color: "bg-[#3B82F6]" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className={`rounded-2xl p-5 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default ${cardBg}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className={`text-2xl font-bold mb-0.5 ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
            <div className={`text-xs font-semibold ${textPrimary}/80`}>{label}</div>
            <div className="text-[10px] text-[#5A6E8E] mt-0.5 truncate" title={sub}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Active sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`font-bold ${textPrimary} text-base`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Active Feedback Sessions</h2>
          <button
            onClick={() => navigate("/student/history")}
            className="text-xs text-[#3B82F6] font-semibold hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
          >
            View history <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {subjectsList.length === 0 ? (
            <div className={`lg:col-span-2 rounded-2xl p-8 border text-center text-xs font-semibold text-gray-500 dark:text-gray-400 ${cardBg}`}>
              No active feedback sessions available.
            </div>
          ) : (
            subjectsList.map((s: any) => (
              <div
                key={s.mappingId}
                className={`rounded-2xl p-5 border transition-all shadow-sm ${
                  s.submitted
                    ? dark
                      ? "bg-white/4 border-white/8 opacity-80"
                      : "bg-[#F8FAFD] border-[#0B3D91]/8"
                    : dark
                      ? "bg-white/5 border-white/10 hover:shadow-md hover:-translate-y-0.5"
                      : "bg-white border-[#0B3D91]/12 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={s.submitted ? "success" : "warning"}>
                        <StatusDot status={s.submitted ? "active" : "scheduled"} />
                        {s.submitted ? "Submitted" : "Pending"}
                      </Badge>
                      <span className="text-[10px] text-[#5A6E8E] font-mono">{s.code}</span>
                    </div>
                    <h3 className={`font-semibold ${textPrimary} text-sm truncate`}>{s.subject}</h3>
                    <p className={`text-xs ${textSub} mt-0.5`}>Faculty: {s.faculty}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-[#5A6E8E] mb-4 bg-gray-50 dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                  <div><span className="font-semibold text-gray-700 dark:text-gray-300">Course:</span> {s.course}</div>
                  <div><span className="font-semibold text-gray-700 dark:text-gray-300">Branch:</span> {s.branch}</div>
                  <div><span className="font-semibold text-gray-700 dark:text-gray-300">Semester:</span> Semester {s.semester}</div>
                  <div className="flex items-center gap-1"><Clock size={10} /> <span className="font-semibold text-gray-700 dark:text-gray-300">Deadline:</span> {s.deadline}</div>
                </div>
                {s.submitted ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 size={13} /> Feedback submitted — identity never stored
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/feedback-form?session=${s.sessionId}&subject=${s.subjectId}&faculty=${s.facultyId}&mapping=${s.mappingId}`)}
                    className="w-full py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-semibold hover:bg-[#0a348a] transition-all shadow-md shadow-[#0B3D91]/20 flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    <MessageSquare size={13} /> Start Feedback
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confidential banner */}
      <div
        className={`rounded-2xl p-5 border ${dark ? "border-white/10" : "border-[#0B3D91]/8"}`}
        style={{
          background: dark
            ? "linear-gradient(135deg, rgba(11,61,145,0.15), rgba(59,130,246,0.05))"
            : "linear-gradient(135deg, #EEF2F8, #E8EEF8)"
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3D91] flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h3 className={`font-bold ${textPrimary} text-sm`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              How your anonymity is protected
            </h3>
            <p className="text-xs text-[#5A6E8E]">Technical privacy guarantees</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Lock, title: "Login ≠ Identity", desc: "Your credentials verify eligibility only. The submission record contains no user ID." },
            { icon: Sparkles, title: "Anonymized Storage", desc: "Feedback is stored without any link to your enrollment number, roll number, or name." },
            { icon: BarChart2, title: "Aggregated Reports", desc: "Administrators only see averaged scores and performance metrics — never individual student identities." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className={`flex gap-3 p-3 rounded-xl border ${
                dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8"
              }`}
            >
              <Icon size={15} className={`text-[#3B82F6] dark:text-blue-300 mt-0.5 shrink-0`} />
              <div>
                <p className={`text-xs font-semibold ${textPrimary}`}>{title}</p>
                <p className="text-[10px] text-[#5A6E8E] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
