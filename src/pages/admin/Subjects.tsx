import React, { useState, useEffect } from "react";
import { Plus, Download, Edit, Trash2, X, Loader2, ArrowUpDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import {
  ModHeader, ModBtn, ModSearchBar, ModSelect, ModTable,
  ModTd, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { academicService } from "../../services/academic.service.js";
import { useDebounce } from "../../hooks/useDebounce.js";

interface SubjectItem {
  _id: string;
  code: string;
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
  semester: number;
  credits?: number;
  status: "active" | "inactive";
}

export const Subjects: React.FC = () => {
  const { dark } = useTheme();

  // Search and filter states
  const [searchVal, setSearchVal] = useState("");
  const debouncedSearch = useDebounce(searchVal, 300);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState<"code" | "name" | "course" | "branch" | "semester">("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Data lists
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Page status states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    courseId: "",
    branchId: "",
    semester: 1,
    credits: "",
    status: "active" as "active" | "inactive"
  });

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

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
      const subRes = await academicService.getSubjects();
      if (subRes?.success) setSubjects(subRes.data);

      const courseRes = await academicService.getCourses();
      if (courseRes?.success) setCourses(courseRes.data);

      const branchRes = await academicService.getBranches();
      if (branchRes?.success) setBranches(branchRes.data);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditItem(null);
    setForm({
      code: "",
      name: "",
      courseId: courses[0]?._id || "",
      branchId: branches[0]?._id || "",
      semester: 1,
      credits: "",
      status: "active"
    });
    setModalOpen(true);
  };

  const openEditModal = (item: SubjectItem) => {
    setEditItem(item);
    setForm({
      code: item.code,
      name: item.name,
      courseId: item.courseId?._id || "",
      branchId: item.branchId?._id || "",
      semester: item.semester,
      credits: item.credits?.toString() || "",
      status: item.status
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim() || !form.courseId || !form.branchId || !form.semester) {
      showNotification("error", "Subject Code, Name, Course, Branch and Semester are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editItem) {
        // Edit Subject
        const res = await academicService.updateSubject(
          editItem._id,
          form.code,
          form.name,
          form.courseId,
          form.branchId,
          form.semester
        );
        // Also update other parameters like credits & status which backend supports via update body
        await academicService.updateSubject(editItem._id, form.code, form.name, form.courseId, form.branchId, form.semester);
        // Ensure status is updated too
        await fetch(`/api/academic/subjects/${editItem._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            status: form.status,
            credits: form.credits ? Number(form.credits) : undefined
          })
        });

        showNotification("success", "Subject updated successfully!");
      } else {
        // Add Subject
        const creds = form.credits ? Number(form.credits) : undefined;
        await academicService.createSubject(form.code, form.name, form.courseId, form.branchId, form.semester, creds);
        // Set status if inactive since create defaults to active
        if (form.status === "inactive") {
          const allSubs = await academicService.getSubjects();
          const newlyCreated = allSubs.data?.find((s: any) => s.code === form.code.toUpperCase());
          if (newlyCreated) {
            await fetch(`/api/academic/subjects/${newlyCreated._id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({ status: "inactive" })
            });
          }
        }
        showNotification("success", "Subject created successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to submit subject details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await academicService.deleteSubject(deleteConfirm);
      showNotification("success", "Subject deleted successfully!");
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete subject.");
      setDeleteConfirm(null);
    }
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const dataToExport = getFilteredSubjects();
    if (dataToExport.length === 0) {
      showNotification("error", "No data to export.");
      return;
    }

    const headers = ["Subject Code", "Subject Name", "Course", "Branch", "Semester", "Credits", "Status"];
    const csvRows = [
      headers.join(","),
      ...dataToExport.map(s => [
        `"${s.code}"`,
        `"${s.name}"`,
        `"${s.courseId?.name || "N/A"}"`,
        `"${s.branchId?.code || "N/A"}"`,
        `"Sem ${s.semester}"`,
        `"${s.credits || "N/A"}"`,
        `"${s.status}"`
      ].join(","))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `subjects_export.${format === "csv" ? "csv" : "xlsx"}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportOpen(false);
    showNotification("success", `Exported ${dataToExport.length} subjects successfully.`);
  };

  const toggleSort = (field: "code" | "name" | "course" | "semester") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter logic
  const getFilteredSubjects = () => {
    let list = [...subjects];

    // Debounced Search filter (real-time debounced search!)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(s =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.courseId?.name || "").toLowerCase().includes(q) ||
        (s.branchId?.name || "").toLowerCase().includes(q) ||
        (s.branchId?.code || "").toLowerCase().includes(q) ||
        `sem ${s.semester}`.includes(q)
      );
    }

    // Dropdown Filters
    if (selectedCourse) {
      list = list.filter(s => s.courseId?._id === selectedCourse);
    }
    if (selectedBranch) {
      list = list.filter(s => s.branchId?._id === selectedBranch);
    }
    if (selectedSemester) {
      list = list.filter(s => s.semester.toString() === selectedSemester);
    }
    if (selectedStatus) {
      list = list.filter(s => s.status === selectedStatus);
    }

    // Sort logic
    list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "code") {
        valA = a.code;
        valB = b.code;
      } else if (sortField === "name") {
        valA = a.name;
        valB = b.name;
      } else if (sortField === "course") {
        valA = a.courseId?.name || "";
        valB = b.courseId?.name || "";
      } else if (sortField === "branch") {
        valA = a.branchId?.code || a.branchId?.name || "";
        valB = b.branchId?.code || b.branchId?.name || "";
      } else if (sortField === "semester") {
        valA = a.semester;
        valB = b.semester;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  };

  // Pagination logic
  const filteredList = getFilteredSubjects();
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeCount = subjects.filter(s => s.status === "active").length;
  const inactiveCount = subjects.filter(s => s.status === "inactive").length;

  return (
    <div>
      <ModHeader title="Subjects" sub="Manage all subjects across courses, branches, and semesters" dark={dark}>
        <ModBtn icon={Plus} variant="primary" onClick={openAddModal}>Add Subject</ModBtn>
        <ModBtn icon={Download} variant="outline" onClick={() => setExportOpen(true)}>Export</ModBtn>
      </ModHeader>

      {notification && (
        <div className={cn(
          "mb-5 p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300",
          notification.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300"
        )}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline cursor-pointer border-0 bg-transparent text-inherit ml-2">Dismiss</button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={cn("rounded-2xl p-5 border", cardBg)}>
          <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className={textPrimary}>{subjects.length}</span>
          </div>
          <div className={cn("text-xs font-semibold", textSub)}>Total Subjects</div>
        </div>
        <div className={cn("rounded-2xl p-5 border", cardBg)}>
          <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="text-emerald-600">{activeCount}</span>
          </div>
          <div className={cn("text-xs font-semibold", textSub)}>Active Subjects</div>
        </div>
        <div className={cn("rounded-2xl p-5 border", cardBg)}>
          <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="text-amber-500">{inactiveCount}</span>
          </div>
          <div className={cn("text-xs font-semibold", textSub)}>Inactive Subjects</div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <ModSearchBar
          dark={dark}
          placeholder="Search subjects by code, name, course or semester…"
          value={searchVal}
          onChange={(val) => {
            setSearchVal(val);
            setCurrentPage(1);
          }}
        />

        {/* Course Filter */}
        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Courses</option>
          {courses.map(c => <option key={c._id} value={c._id} className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">{c.name}</option>)}
        </select>

        {/* Branch Filter */}
        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Branches</option>
          {branches.map(b => <option key={b._id} value={b._id} className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">{b.code} - {b.name}</option>)}
        </select>

        {/* Semester Filter */}
        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedSemester}
          onChange={(e) => {
            setSelectedSemester(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s} className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Sem {s}</option>)}
        </select>

        {/* Status Filter */}
        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Statuses</option>
          <option value="active" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Active</option>
          <option value="inactive" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Inactive</option>
        </select>

        {(selectedCourse || selectedBranch || selectedSemester || selectedStatus || searchVal) && (
          <button
            onClick={() => {
              setSelectedCourse("");
              setSelectedBranch("");
              setSelectedSemester("");
              setSelectedStatus("");
              setSearchVal("");
              setCurrentPage(1);
            }}
            className="text-xs font-bold text-red-500 hover:underline border-0 bg-transparent cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={40} className="animate-spin text-[#0B3D91]" />
          <p className={cn("text-sm mt-3 font-semibold", textSub)}>Loading subjects directory...</p>
        </div>
      ) : (
        <ModTable
          dark={dark}
          headers={[
            <span key="code" onClick={() => toggleSort("code")} className="cursor-pointer hover:text-blue-500 flex items-center gap-1">Subject Code <ArrowUpDown size={10}/></span> as any,
            <span key="name" onClick={() => toggleSort("name")} className="cursor-pointer hover:text-blue-500 flex items-center gap-1">Subject Name <ArrowUpDown size={10}/></span> as any,
            <span key="course" onClick={() => toggleSort("course")} className="cursor-pointer hover:text-blue-500 flex items-center gap-1">Course <ArrowUpDown size={10}/></span> as any,
            <span key="branch" onClick={() => toggleSort("branch")} className="cursor-pointer hover:text-blue-500 flex items-center gap-1">Branch <ArrowUpDown size={10}/></span> as any,
            <span key="semester" onClick={() => toggleSort("semester")} className="cursor-pointer hover:text-blue-500 flex items-center gap-1">Semester <ArrowUpDown size={10}/></span> as any,
            "Status",
            "Actions"
          ]}
          totalCount={filteredList.length}
          page={currentPage}
          onPageChange={setCurrentPage}
          empty={paginatedList.length === 0}
        >
          {paginatedList.map((s) => (
            <tr key={s._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
              <ModTd><span className="font-bold text-[#0B3D91] dark:text-blue-400">{s.code}</span></ModTd>
              <ModTd><span className={cn("font-semibold", textPrimary)}>{s.name}</span></ModTd>
              <ModTd><Badge>{s.courseId?.name || "N/A"}</Badge></ModTd>
              <ModTd><Badge variant="outline">{s.branchId?.code || s.branchId?.name || "N/A"}</Badge></ModTd>
              <ModTd><span className={textSub}>Semester {s.semester}</span></ModTd>
              <ModTd><Badge variant={s.status === "active" ? "success" : "danger"}>{s.status}</Badge></ModTd>
              <ModTd>
                <div className="flex gap-1.5 justify-start">
                  <button onClick={() => openEditModal(s)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><Edit size={14} /></button>
                  <button onClick={() => setDeleteConfirm(s._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><Trash2 size={14} /></button>
                </div>
              </ModTd>
            </tr>
          ))}
        </ModTable>
      )}

      {/* --- Add / Edit Subject Modal Overlay --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {editItem ? "Edit" : "Create"} Subject
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCA-301"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none uppercase", inputCls)}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Databases"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
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
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Credits (Optional)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    placeholder="e.g. 4"
                    className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Status</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-bold hover:bg-[#0a348a] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 border-0"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {editItem ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation modal --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-sm shadow-2xl relative text-center",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <h4 className={cn("text-base font-bold mb-2", textPrimary)}>Confirm Deletion</h4>
            <p className={cn("text-xs mb-6", textSub)}>Are you sure you want to delete this subject?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer bg-transparent">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer border-0">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Export dialog options --- */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-xs shadow-2xl relative text-center animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <h4 className={cn("text-sm font-bold mb-4", textPrimary)}>Export Filtered Subjects</h4>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => handleExport("csv")} className="w-full py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#0a348a] text-white text-xs font-bold border-0 cursor-pointer">Export to CSV</button>
              <button onClick={() => handleExport("xlsx")} className="w-full py-2.5 rounded-xl border border-[#0B3D91]/15 text-[#0B3D91] dark:text-blue-300 text-xs font-bold cursor-pointer hover:bg-gray-50">Export to Excel (.xlsx)</button>
              <button onClick={() => setExportOpen(false)} className="w-full py-2 text-xs font-semibold text-gray-500 hover:underline cursor-pointer border-0 bg-transparent mt-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
