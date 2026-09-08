import React, { useState, useEffect } from "react";
import { Plus, Download, Edit, Trash2, Search, X, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import {
  ModHeader, ModBtn, ModSearchBar, ModTable,
  ModTd, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { academicService } from "../../services/academic.service.js";
import { facultyService } from "../../services/faculty.service.js";

interface CourseItem {
  _id: string;
  name: string;
  duration: number;
  status: "active" | "inactive";
}

interface BranchItem {
  _id: string;
  code: string;
  name: string;
  courseId: {
    _id: string;
    name: string;
  } | null;
  coordinatorId?: {
    _id: string;
    name: string;
  } | string | null;
  status: "active" | "inactive";
}

interface FacultyItem {
  _id: string;
  name: string;
  email: string;
}

export const AcademicStructure: React.FC = () => {
  const { dark } = useTheme();
  const [tab, setTab] = useState("courses");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Lists
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);

  // Page States
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Deletion Confirmation States
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "course" | "branch" } | null>(null);

  // Modal Form States
  const [courseForm, setCourseForm] = useState({ name: "", duration: 4 });
  const [branchForm, setBranchForm] = useState({ code: "", name: "", courseId: "", coordinatorId: "" });

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const tabs = ["courses", "branches"];

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const courseRes = await academicService.getCourses();
      if (courseRes?.success) setCourses(courseRes.data);

      const branchRes = await academicService.getBranches();
      if (branchRes?.success) setBranches(branchRes.data);

      const facultyRes = await facultyService.getFacultyList();
      if (facultyRes?.success) setFaculties(facultyRes.data);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load academic structures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditItem(null);
    if (tab === "courses") {
      setCourseForm({ name: "", duration: 4 });
    } else if (tab === "branches") {
      setBranchForm({ code: "", name: "", courseId: courses[0]?._id || "", coordinatorId: "" });
    }
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    if (tab === "courses") {
      setCourseForm({ name: item.name, duration: item.duration });
    } else if (tab === "branches") {
      setBranchForm({
        code: item.code || "",
        name: item.name,
        courseId: item.courseId?._id || item.courseId || "",
        coordinatorId: item.coordinatorId?._id || item.coordinatorId || "",
      });
    }
    setModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tab === "courses") {
        if (!courseForm.name.trim()) throw new Error("Course Name is required");
        if (editItem) {
          await academicService.updateCourse(editItem._id, courseForm.name, courseForm.duration);
          showNotification("success", "Course updated successfully!");
        } else {
          await academicService.createCourse(courseForm.name, courseForm.duration);
          showNotification("success", "Course created successfully!");
        }
      } else if (tab === "branches") {
        if (!branchForm.code.trim()) throw new Error("Branch Code is required");
        if (!branchForm.name.trim()) throw new Error("Branch Name is required");
        if (!branchForm.courseId) throw new Error("Course is required");
        if (editItem) {
          await academicService.updateBranch(
            editItem._id,
            branchForm.code,
            branchForm.name,
            branchForm.courseId,
            branchForm.coordinatorId || undefined
          );
          showNotification("success", "Branch updated successfully!");
        } else {
          await academicService.createBranch(
            branchForm.code,
            branchForm.name,
            branchForm.courseId,
            branchForm.coordinatorId || undefined
          );
          showNotification("success", "Branch created successfully!");
        }
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { id, type } = deleteConfirm;
      if (type === "course") await academicService.deleteCourse(id);
      else if (type === "branch") await academicService.deleteBranch(id);

      showNotification("success", `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete item.");
      setDeleteConfirm(null);
    }
  };

  const getFilteredCourses = () => {
    return courses.filter(c =>
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.duration.toString().includes(debouncedSearch)
    );
  };

  const getFilteredBranches = () => {
    return branches.filter(b => {
      const courseName = b.courseId?.name || "";
      const coordName = typeof b.coordinatorId === "object" ? b.coordinatorId?.name || "" : "";
      return b.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
             b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
             courseName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
             coordName.toLowerCase().includes(debouncedSearch.toLowerCase());
    });
  };

  return (
    <div>
      <ModHeader title="Academic Structure" sub="Manage courses, branches, and class coordinators" dark={dark}>
        <ModBtn icon={Plus} variant="primary" onClick={openCreateModal}>Add New</ModBtn>
        <ModBtn icon={Download} variant="outline" onClick={loadData}>Refresh</ModBtn>
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

      {/* Tabs */}
      <div className={cn("flex flex-wrap gap-1 p-1 rounded-2xl mb-6 w-full sm:w-fit", dark ? "bg-white/8" : "bg-[#EEF2F8]")}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearch("");
            }}
            className={cn(
              "flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold capitalize transition-all cursor-pointer border-0 text-center",
              tab === t
                ? "bg-[#0B3D91] text-white shadow-md"
                : dark
                  ? "text-white/60 hover:text-white bg-transparent"
                  : "text-[#5A6E8E] hover:text-[#0D1B3E] bg-transparent"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 w-full sm:max-w-md">
        <ModSearchBar dark={dark} placeholder={`Search ${tab}…`} value={search} onChange={setSearch} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-[#0B3D91]" />
          <p className={cn("text-sm mt-3 font-medium", textSub)}>Loading dynamic list records...</p>
        </div>
      ) : (
        <>
          {tab === "courses" && (
            <ModTable dark={dark} headers={["Course Name", "Duration", "Status", "Actions"]} totalCount={getFilteredCourses().length}>
              {getFilteredCourses().length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-xs font-semibold text-gray-400">No courses found matching "{search}"</td>
                </tr>
              ) : (
                getFilteredCourses().map((r) => (
                  <tr key={r._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                    <ModTd><span className={cn("font-bold", textPrimary)}>{r.name}</span></ModTd>
                    <ModTd><span className={textSub}>{r.duration} Years</span></ModTd>
                    <ModTd><Badge variant={r.status === "active" ? "success" : "danger"}>{r.status}</Badge></ModTd>
                    <ModTd>
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(r)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"><Edit size={14} /></button>
                        <button onClick={() => setDeleteConfirm({ id: r._id, type: "course" })} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"><Trash2 size={14} /></button>
                      </div>
                    </ModTd>
                  </tr>
                ))
              )}
            </ModTable>
          )}

          {tab === "branches" && (
            <ModTable dark={dark} headers={["Branch Code", "Branch Name", "Course", "Class Coordinator", "Status", "Actions"]} totalCount={getFilteredBranches().length}>
              {getFilteredBranches().length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs font-semibold text-gray-400">No branches found matching "{search}"</td>
                </tr>
              ) : (
                getFilteredBranches().map((r) => (
                  <tr key={r._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                    <ModTd><span className={cn("font-bold text-[#0B3D91] dark:text-blue-400")}>{r.code}</span></ModTd>
                    <ModTd><span className={cn("font-semibold", textPrimary)}>{r.name}</span></ModTd>
                    <ModTd><Badge>{r.courseId?.name || "N/A"}</Badge></ModTd>
                    <ModTd><span className={textSub}>{typeof r.coordinatorId === "object" ? r.coordinatorId?.name : "Not Assigned"}</span></ModTd>
                    <ModTd><Badge variant={r.status === "active" ? "success" : "danger"}>{r.status}</Badge></ModTd>
                    <ModTd>
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(r)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"><Edit size={14} /></button>
                        <button onClick={() => setDeleteConfirm({ id: r._id, type: "branch" })} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"><Trash2 size={14} /></button>
                      </div>
                    </ModTd>
                  </tr>
                ))
              )}
            </ModTable>
          )}
        </>
      )}

      {/* --- Add / Edit Modal Overlay --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {editItem ? "Edit" : "Create"} {tab.charAt(0).toUpperCase() + tab.slice(1, -1)}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {tab === "courses" && (
                <>
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Course Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bachelor of Technology"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30",
                        dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]"
                      )}
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Duration (Years)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={6}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30",
                        dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]"
                      )}
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {tab === "branches" && (
                <>
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Branch Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MCA"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 uppercase",
                        dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]"
                      )}
                      value={branchForm.code}
                      onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Branch Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master of Computer Applications"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30",
                        dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]"
                      )}
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Select Course</label>
                    <select
                      required
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none",
                        dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]"
                      )}
                      value={branchForm.courseId}
                      onChange={(e) => setBranchForm({ ...branchForm, courseId: e.target.value })}
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Assign Class Coordinator</label>
                    <select
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none",
                        dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]"
                      )}
                      value={branchForm.coordinatorId}
                      onChange={(e) => setBranchForm({ ...branchForm, coordinatorId: e.target.value })}
                    >
                      <option value="">Select Faculty as Class Coordinator</option>
                      {faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
                    </select>
                  </div>
                </>
              )}

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
                  {editItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Deletion Confirmation Dialog --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-sm shadow-2xl relative text-center",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <h4 className={cn("text-base font-bold mb-2", textPrimary)}>Confirm Deletion</h4>
            <p className={cn("text-xs mb-6", textSub)}>
              Are you sure you want to delete this {deleteConfirm.type}? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer border-0"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicStructure;
