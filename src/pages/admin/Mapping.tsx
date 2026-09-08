import React, { useState, useEffect } from "react";
import { Plus, Zap, AlertTriangle, Trash2, X, Loader2, Edit2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import {
  ModHeader, ModBtn, ModTable, ModTd, ModSearchBar, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { AcademicSessionDropdown } from "../../components/common/AcademicSessionDropdown.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { mappingService } from "../../services/mapping.service.js";
import { academicService } from "../../services/academic.service.js";
import { facultyService } from "../../services/faculty.service.js";

interface MappingItem {
  _id: string;
  facultyId: {
    _id: string;
    name: string;
  } | null;
  subjectId: {
    _id: string;
    code: string;
    name: string;
  } | null;
  courseId: {
    _id: string;
    name: string;
  } | null;
  branchId: {
    _id: string;
    code: string;
    name: string;
  } | null;
  semester: number;
  academicYear?: string;
}

export const Mapping: React.FC = () => {
  const { dark } = useTheme();

  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Page States
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters State
  const [filterCourse, setFilterCourse] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Create Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    facultyId: "",
    subjectId: "",
    courseId: "",
    branchId: "",
    semester: 1,
    academicYear: "2025-26",
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
      const mapRes = await mappingService.getMappings();
      if (mapRes?.success) setMappings(mapRes.data);

      const courseRes = await academicService.getCourses();
      if (courseRes?.success) setCourses(courseRes.data);

      const branchRes = await academicService.getBranches();
      if (branchRes?.success) setBranches(branchRes.data);

      const facultyRes = await facultyService.getFacultyList();
      if (facultyRes?.success) setFaculties(facultyRes.data);

      const subjectRes = await academicService.getSubjects();
      if (subjectRes?.success) setSubjects(subjectRes.data);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load mapping data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCourse, filterBranch, filterSemester, debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.facultyId || !form.subjectId || !form.courseId || !form.branchId || !form.semester) {
      showNotification("error", "All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await mappingService.updateMapping(editingId, form);
        if (res?.success) {
          showNotification("success", "Mapping updated successfully!");
          setModalOpen(false);
          loadData();
        }
      } else {
        const res = await mappingService.createMapping(form);
        if (res?.success) {
          showNotification("success", "Faculty-subject mapping created successfully!");
          setModalOpen(false);
          setForm({
            facultyId: "",
            subjectId: "",
            courseId: "",
            branchId: "",
            semester: 1,
            academicYear: "2025-26",
          });
          loadData();
        }
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to save mapping.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this mapping?")) return;
    try {
      const res = await mappingService.deleteMapping(id);
      if (res?.success) {
        showNotification("success", "Mapping removed successfully.");
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete mapping.");
    }
  };

  // Filter dynamic mappings
  const getFilteredMappings = () => {
    return mappings.filter(m => {
      const matchC = !filterCourse || m.courseId?._id === filterCourse;
      const matchB = !filterBranch || m.branchId?._id === filterBranch;
      const matchSem = !filterSemester || m.semester.toString() === filterSemester;

      const q = debouncedSearch.toLowerCase().trim();
      const matchSearch = !q ||
        (m.subjectId?.name || "").toLowerCase().includes(q) ||
        (m.subjectId?.code || "").toLowerCase().includes(q) ||
        (m.facultyId?.name || "").toLowerCase().includes(q);

      return matchC && matchB && matchSem && matchSearch;
    });
  };

  const openNewMapping = () => {
    setEditingId(null);
    setForm({
      facultyId: faculties[0]?._id || "",
      subjectId: "",
      courseId: courses[0]?._id || "",
      branchId: branches.filter(b => b.courseId?._id === courses[0]?._id || b.courseId === courses[0]?._id)[0]?._id || "",
      semester: 1,
      academicYear: "2025-26",
    });
    setModalOpen(true);
  };

  const openEditMapping = (mapping: MappingItem) => {
    setEditingId(mapping._id);
    setForm({
      facultyId: mapping.facultyId?._id || "",
      subjectId: mapping.subjectId?._id || "",
      courseId: mapping.courseId?._id || "",
      branchId: mapping.branchId?._id || "",
      semester: mapping.semester || 1,
      academicYear: mapping.academicYear || "2025-26",
    });
    setModalOpen(true);
  };

  // Filter subjects for create form dropdown based on selected course, branch, and semester
  const getFilteredSubjectsForForm = () => {
    return subjects.filter(s => {
      const matchC = !form.courseId || s.courseId?._id === form.courseId || s.courseId === form.courseId;
      const matchB = !form.branchId || s.branchId?._id === form.branchId || s.branchId === form.branchId;
      const matchSem = !form.semester || s.semester === form.semester;
      return matchC && matchB && matchSem;
    });
  };

  return (
    <div>
      <ModHeader title="Faculty–Subject Mapping" sub="Map faculty members to subjects, semesters, and sections" dark={dark}>
        <ModBtn icon={Plus} variant="primary" onClick={openNewMapping}>New Mapping</ModBtn>
        <ModBtn icon={Zap} variant="outline" onClick={loadData}>Refresh</ModBtn>
      </ModHeader>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: filter panel */}
        <div className={cn("rounded-2xl border p-5 h-fit", cardBg)}>
          <p className={cn("text-xs font-bold uppercase tracking-widest mb-4", textSub)}>Filter Mappings</p>
          <div className="space-y-3">
            <div>
              <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Select Course</label>
              <select
                className={cn("w-full px-3 py-2 rounded-xl border text-sm focus:outline-none", inputCls)}
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Select Branch</label>
              <select
                className={cn("w-full px-3 py-2 rounded-xl border text-sm focus:outline-none", inputCls)}
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.code} - {b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Select Semester</label>
              <select
                className={cn("w-full px-3 py-2 rounded-xl border text-sm focus:outline-none", inputCls)}
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <button
              onClick={() => {
                setFilterCourse("");
                setFilterBranch("");
                setFilterSemester("");
              }}
              className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer mt-2"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Right: mapping table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="max-w-md">
            <ModSearchBar dark={dark} placeholder="Search mappings by subject or faculty…" value={search} onChange={setSearch} />
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-transparent">
              <Loader2 size={36} className="animate-spin text-[#0B3D91]" />
              <p className={cn("text-sm mt-3 font-medium", textSub)}>Loading faculty mappings...</p>
            </div>
          ) : (
            <ModTable
              dark={dark}
              headers={["Subject", "Faculty", "Course", "Branch", "Sem", "Session", "Actions"]}
              totalCount={getFilteredMappings().length}
              page={currentPage}
              onPageChange={setCurrentPage}
              empty={getFilteredMappings().length === 0}
            >
              {getFilteredMappings().slice((currentPage - 1) * 10, currentPage * 10).map((r) => (
                <tr key={r._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                  <ModTd>
                    <div className="flex flex-col">
                      <span className={cn("font-semibold", textPrimary)}>{r.subjectId?.name || "N/A"}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{r.subjectId?.code || "N/A"}</span>
                    </div>
                  </ModTd>
                  <ModTd><span className={cn("font-bold text-[#0B3D91] dark:text-blue-300")}>{r.facultyId?.name || "Unassigned"}</span></ModTd>
                  <ModTd><span className={textSub}>{r.courseId?.name || "N/A"}</span></ModTd>
                  <ModTd><span className={textSub}>{r.branchId?.code || "N/A"}</span></ModTd>
                  <ModTd><span className={textSub}>Sem {r.semester}</span></ModTd>
                  <ModTd><span className={textSub}>{r.academicYear || "2025-26"}</span></ModTd>
                  <ModTd>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditMapping(r)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </ModTd>
                </tr>
              ))}
            </ModTable>
          )}
        </div>
      </div>

      {/* --- Add Mapping Modal Overlay --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {editingId ? "Edit Mapping" : "Create Faculty-Subject Mapping"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Academic Session</label>
                <AcademicSessionDropdown
                  value={form.academicYear}
                  onChange={(val) => setForm({ ...form, academicYear: val })}
                  className="w-full"
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Course</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.courseId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    const courseBranches = branches.filter(b => b.courseId?._id === cid || b.courseId === cid);
                    setForm({
                      ...form,
                      courseId: cid,
                      branchId: courseBranches[0]?._id || "",
                      subjectId: ""
                    });
                  }}
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Branch</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.branchId}
                  onChange={(e) => {
                    const bid = e.target.value;
                    setForm({ ...form, branchId: bid, subjectId: "" });
                  }}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.code} - {b.name}</option>)}
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Semester</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.semester}
                  onChange={(e) => {
                    const sem = Number(e.target.value);
                    setForm({ ...form, semester: sem, subjectId: "" });
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Subject</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                >
                  <option value="">Select Subject</option>
                  {getFilteredSubjectsForForm().map(s => (
                    <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                  ))}
                </select>
                {getFilteredSubjectsForForm().length === 0 && form.courseId && form.branchId && (
                  <span className="text-[10px] text-amber-500 mt-1 block">No subjects found for this combination. Please add one under Subjects first.</span>
                )}
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Faculty Member</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.facultyId}
                  onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-bold hover:bg-[#0a348a] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 border-0"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {editingId ? "Save Changes" : "Assign Mapping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mapping;
