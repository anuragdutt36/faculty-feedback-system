import React, { useState, useEffect } from "react";
import { Plus, Download, RefreshCw, Activity, Calendar, CheckCircle2, FileText, Send, Loader2, X, Trash2, Power } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import {
  ModHeader, ModBtn, ModTable, ModTd, ModStatusBadge, ModSearchBar, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { AcademicSessionDropdown } from "../../components/common/AcademicSessionDropdown.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { StatusDot } from "../../components/common/StatusDot.js";
import { sessionService } from "../../services/session.service.js";
import { academicService } from "../../services/academic.service.js";

interface SessionItem {
  _id: string;
  name: string;
  courseId: {
    _id: string;
    name: string;
  } | null;
  branchId: {
    _id: string;
    code: string;
    name: string;
  } | null;
  year: number;
  semester: number;
  academicYear: string;
  status: "draft" | "scheduled" | "active" | "closed";
  startDate: string;
  endDate: string;
  responsesCount?: number;
}

export const FeedbackSessions: React.FC = () => {
  const { dark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);

  // Page states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    academicYear: "2025-26",
    courseId: "",
    branchId: "",
    year: 1,
    semester: 1,
    startDate: "",
    endDate: "",
    customMessage: "",
  });

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";
  const inputCls = dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]";

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const sesRes = await sessionService.getSessions();
      if (sesRes?.success) setSessions(sesRes.data);

      const courseRes = await academicService.getCourses();
      if (courseRes?.success) {
        setCourses(courseRes.data);
        if (courseRes.data.length > 0 && !form.courseId) {
          setForm(f => ({ ...f, courseId: courseRes.data[0]._id }));
        }
      }

      const branchRes = await academicService.getBranches();
      if (branchRes?.success) {
        setBranches(branchRes.data);
        if (branchRes.data.length > 0 && !form.branchId) {
          setForm(f => ({ ...f, branchId: branchRes.data[0]._id }));
        }
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.branchId || !form.startDate || !form.endDate || !form.name.trim()) {
      showNotification("error", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await sessionService.createSession(form);
      if (res?.success) {
        showNotification("success", "Feedback session created successfully!");
        setShowForm(false);
        setForm({
          name: "",
          academicYear: "2025-26",
          courseId: courses[0]?._id || "",
          branchId: branches[0]?._id || "",
          year: 1,
          semester: 1,
          startDate: "",
          endDate: "",
          customMessage: "",
        });
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to create session.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await sessionService.activateSession(id);
      if (res?.success) {
        showNotification("success", "Session activated and students notified!");
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to activate session.");
    }
  };

  const handleClose = async (id: string) => {
    try {
      const res = await sessionService.closeSession(id);
      if (res?.success) {
        showNotification("success", "Session closed successfully!");
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to close session.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      const res = await sessionService.deleteSession(id);
      if (res?.success) {
        showNotification("success", "Session deleted successfully!");
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete session.");
    }
  };

  const activeCount = sessions.filter(s => s.status === "active").length;
  const scheduledCount = sessions.filter(s => s.status === "scheduled").length;
  const closedCount = sessions.filter(s => s.status === "closed").length;

  const getFilteredSessions = () => {
    if (!debouncedSearch.trim()) return sessions;
    const q = debouncedSearch.toLowerCase();
    return sessions.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.academicYear.toLowerCase().includes(q) ||
      (s.courseId?.name || "").toLowerCase().includes(q) ||
      (s.branchId?.code || "").toLowerCase().includes(q)
    );
  };
  const filteredSessions = getFilteredSessions();

  return (
    <div>
      <ModHeader title="Feedback Sessions" sub="Create, monitor, and manage all feedback sessions" dark={dark}>
        <ModBtn icon={Plus} variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create Session"}
        </ModBtn>
        <ModBtn icon={RefreshCw} variant="outline" onClick={loadData}>Refresh</ModBtn>
      </ModHeader>

      {/* Success/Error Notification Toast */}
      {notification && (
        <div className={cn(
          "mb-5 p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm",
          notification.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300"
        )}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline cursor-pointer border-0 bg-transparent text-inherit ml-2">Dismiss</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={cn("rounded-2xl p-5 border", cardBg)}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-emerald-500"><Activity size={18} className="text-white" /></div>
          <div className={cn("text-2xl font-bold mb-0.5", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{activeCount}</div>
          <div className={cn("text-xs", textSub)}>Active Sessions</div>
        </div>
        <div className={cn("rounded-2xl p-5 border", cardBg)}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-500"><Calendar size={18} className="text-white" /></div>
          <div className={cn("text-2xl font-bold mb-0.5", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{scheduledCount}</div>
          <div className={cn("text-xs", textSub)}>Scheduled Sessions</div>
        </div>
        <div className={cn("rounded-2xl p-5 border", cardBg)}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-[#0B3D91]"><CheckCircle2 size={18} className="text-white" /></div>
          <div className={cn("text-2xl font-bold mb-0.5", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{closedCount}</div>
          <div className={cn("text-xs", textSub)}>Closed Sessions</div>
        </div>
      </div>

      {/* Create Session Form */}
      {showForm && (
        <div className={cn("rounded-2xl border p-6 mb-6", cardBg)}>
          <h3 className={cn("font-bold text-base mb-5", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Create New Feedback Session</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Session Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCA Sem 3 Feedback"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30", inputCls)}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Academic Session</label>
                <AcademicSessionDropdown
                  value={form.academicYear}
                  onChange={(val) => setForm({ ...form, academicYear: val })}
                  className="w-full"
                />
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Select Course</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                >
                  <option value="">Choose Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Select Branch</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                >
                  <option value="">Choose Branch</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.code} - {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Year Level</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                >
                  {[
                    { val: 1, label: "1st Year" },
                    { val: 2, label: "2nd Year" },
                    { val: 3, label: "3rd Year" },
                    { val: 4, label: "4th Year" }
                  ].map(y => <option key={y.val} value={y.val}>{y.label}</option>)}
                </select>
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Semester</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Start Date</label>
                <input
                  type="date"
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>End Date</label>
                <input
                  type="date"
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Custom message — full width row */}
            <div>
              <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>
                Message to Students
                <span className={cn("ml-2 font-normal", textSub)}>(optional — shown in their notification)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="e.g. Please ensure you give honest feedback. This helps improve teaching quality."
                className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 resize-none", inputCls)}
                value={form.customMessage}
                onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
              />
              <p className={cn("text-[10px] mt-1", textSub)}>{form.customMessage.length}/500</p>
            </div>
            <div className="flex gap-3 pt-3">
              <ModBtn type="submit" icon={Send} variant="primary" disabled={submitting}>
                {submitting ? "Creating..." : "Activate Session"}
              </ModBtn>
              <ModBtn type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</ModBtn>
            </div>
          </form>
        </div>
      )}

      <div className="max-w-md mb-4">
        <ModSearchBar dark={dark} placeholder="Search sessions by name, course, branch…" value={search} onChange={setSearch} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-[#0B3D91]" />
          <p className={cn("text-sm mt-3 font-medium", textSub)}>Loading feedback sessions...</p>
        </div>
      ) : (
        <ModTable
          dark={dark}
          headers={["Session Name", "Academic Session", "Course", "Branch", "Year", "Sem", "Start", "End", "Status", "Actions"]}
          totalCount={filteredSessions.length}
          page={currentPage}
          onPageChange={setCurrentPage}
        >
          {filteredSessions.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center py-8 text-xs font-semibold text-gray-400">No feedback sessions found.</td>
            </tr>
          ) : (
            filteredSessions.slice((currentPage - 1) * 10, currentPage * 10).map((r) => (
              <tr key={r._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                <ModTd><span className={cn("font-semibold", textPrimary)}>{r.name}</span></ModTd>
                <ModTd><Badge>{r.academicYear}</Badge></ModTd>
                <ModTd><span className={textSub}>{r.courseId?.name || "N/A"}</span></ModTd>
                <ModTd><span className={textSub}>{r.branchId?.code || "N/A"}</span></ModTd>
                <ModTd><span className={textSub}>{r.year} Yr</span></ModTd>
                <ModTd><span className={textSub}>Sem {r.semester}</span></ModTd>
                <ModTd><span className={textSub}>{new Date(r.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></ModTd>
                <ModTd><span className={textSub}>{new Date(r.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></ModTd>
                <ModTd><ModStatusBadge status={r.status} /></ModTd>
                <ModTd>
                  <div className="flex gap-2">
                    {(r.status === "scheduled" || r.status === "draft") && (
                      <button
                        title="Activate Session Now"
                        onClick={() => handleActivate(r._id)}
                        className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"
                      >
                        <Power size={14} />
                      </button>
                    )}
                    {r.status === "active" && (
                      <button
                        title="Close Session"
                        onClick={() => handleClose(r._id)}
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"
                      >
                        <Power size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </ModTd>
              </tr>
            ))
          )}
        </ModTable>
      )}
    </div>
  );
};

export default FeedbackSessions;
