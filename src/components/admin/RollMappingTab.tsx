import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, ModTable, ModTd } from "./AdminShared.js";
import { AcademicSessionDropdown } from "../common/AcademicSessionDropdown.js";
import { settingsService } from "../../services/settings.service.js";
import { academicService } from "../../services/academic.service.js";

interface RollMappingItem {
  _id: string;
  startRoll: string;
  endRoll: string;
  courseId: { _id: string; name: string } | null;
  branchId: { _id: string; code: string; name: string } | null;
  currentYear: number;
  currentSemester: number;
  academicSession: string;
  isActive: boolean;
}

export const RollMappingTab: React.FC = () => {
  const { dark } = useTheme();
  const [mappings, setMappings] = useState<RollMappingItem[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    startRoll: "",
    endRoll: "",
    courseId: "",
    branchId: "",
    currentYear: 1,
    currentSemester: 1,
    academicSession: "2026-27",
    isActive: true,
  });

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";
  const inputCls = dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]";

  const loadData = async () => {
    setLoading(true);
    try {
      const [mapsRes, coursesRes, branchesRes] = await Promise.allSettled([
        settingsService.getRollMappings(),
        academicService.getCourses(),
        academicService.getBranches(),
      ]);
      
      if (mapsRes.status === "fulfilled" && mapsRes.value?.success) setMappings(mapsRes.value.data);
      else console.error("Failed to fetch roll mappings:", mapsRes);

      if (coursesRes.status === "fulfilled" && coursesRes.value?.success) setCourses(coursesRes.value.data);
      else console.error("Failed to fetch courses:", coursesRes);

      if (branchesRes.status === "fulfilled" && branchesRes.value?.success) setBranches(branchesRes.value.data);
      else console.error("Failed to fetch branches:", branchesRes);
    } catch (err: any) {
      console.error("loadData error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({
      startRoll: "",
      endRoll: "",
      courseId: courses[0]?._id || "",
      branchId: branches[0]?._id || "",
      currentYear: 1,
      currentSemester: 1,
      academicSession: "2026-27",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (m: RollMappingItem) => {
    setEditingId(m._id);
    setForm({
      startRoll: m.startRoll,
      endRoll: m.endRoll,
      courseId: m.courseId?._id || "",
      branchId: m.branchId?._id || "",
      currentYear: m.currentYear,
      currentSemester: m.currentSemester,
      academicSession: m.academicSession,
      isActive: m.isActive,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.startRoll || !form.endRoll) {
      setError("Start Roll and End Roll are required");
      return;
    }
    if (!/^\d+$/.test(form.startRoll) || !/^\d+$/.test(form.endRoll)) {
      setError("Roll Start and Roll End must contain numeric values only");
      return;
    }
    if (parseInt(form.startRoll, 10) > parseInt(form.endRoll, 10)) {
      setError("Start Roll must be less than or equal to End Roll");
      return;
    }
    if (!form.courseId || !form.branchId || !form.academicSession) {
      setError("Course, Branch, and Academic Session must be selected");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await settingsService.updateRollMapping(editingId, form);
      } else {
        await settingsService.createRollMapping(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save roll mapping");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this roll mapping?")) return;
    try {
      await settingsService.deleteRollMapping(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  return (
    <div className={cn("p-6 rounded-2xl border flex flex-col gap-5", cardBg)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-lg font-bold", textPrimary)}>Roll Number Mapping</h2>
          <p className={cn("text-xs mt-1", textSub)}>Define roll number ranges to automatically assign student profiles.</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-[#0B3D91] text-white rounded-xl text-xs font-bold hover:bg-[#0a348a] flex items-center gap-2 border-0 cursor-pointer"
        >
          <Plus size={14} /> Add Range
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 size={24} className="animate-spin text-[#0B3D91]" />
        </div>
      ) : (
        <ModTable
          dark={dark}
          headers={["Start Roll", "End Roll", "Course", "Branch", "Year/Sem", "Session", "Status", "Actions"]}
          totalCount={mappings.length}
          empty={mappings.length === 0}
        >
          {mappings.map(m => (
            <tr key={m._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
              <ModTd><span className="font-mono text-sm font-semibold">{m.startRoll}</span></ModTd>
              <ModTd><span className="font-mono text-sm font-semibold">{m.endRoll}</span></ModTd>
              <ModTd><span className={textSub}>{m.courseId?.name || "N/A"}</span></ModTd>
              <ModTd><span className={textSub}>{m.branchId?.code || "N/A"}</span></ModTd>
              <ModTd><span className={textSub}>Yr {m.currentYear}, Sem {m.currentSemester}</span></ModTd>
              <ModTd><span className={textSub}>{m.academicSession}</span></ModTd>
              <ModTd>
                <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase", m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600")}>
                  {m.isActive ? "Active" : "Inactive"}
                </span>
              </ModTd>
              <ModTd>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(m._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent">
                    <Trash2 size={14} />
                  </button>
                </div>
              </ModTd>
            </tr>
          ))}
        </ModTable>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn("rounded-3xl border p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200", dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10")}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)}>{editingId ? "Edit Range" : "Add Roll Number Range"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Start Roll</label>
                  <input type="text" value={form.startRoll} onChange={e => setForm({...form, startRoll: e.target.value.trim()})} className={cn("w-full px-3 py-2 rounded-xl border text-sm", inputCls)} />
                </div>
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>End Roll</label>
                  <input type="text" value={form.endRoll} onChange={e => setForm({...form, endRoll: e.target.value.trim()})} className={cn("w-full px-3 py-2 rounded-xl border text-sm", inputCls)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Course</label>
                  <select value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value, branchId: ""})} className={cn("w-full px-3 py-2 rounded-xl border text-sm", inputCls)}>
                    <option value="" disabled>Select Course...</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Branch</label>
                  <select value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})} className={cn("w-full px-3 py-2 rounded-xl border text-sm", inputCls)} disabled={!form.courseId}>
                    <option value="" disabled>Select Branch...</option>
                    {branches.filter(b => b.courseId?._id === form.courseId || b.courseId === form.courseId).map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Current Year</label>
                  <input type="number" min="1" max="5" required value={form.currentYear} onChange={e => setForm({...form, currentYear: parseInt(e.target.value)})} className={cn("w-full px-3 py-2 rounded-xl border text-sm", inputCls)} />
                </div>
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Current Semester</label>
                  <input type="number" min="1" max="10" required value={form.currentSemester} onChange={e => setForm({...form, currentSemester: parseInt(e.target.value)})} className={cn("w-full px-3 py-2 rounded-xl border text-sm", inputCls)} />
                </div>
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Academic Session</label>
                <AcademicSessionDropdown value={form.academicSession} onChange={v => setForm({...form, academicSession: v})} className="w-full" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4 cursor-pointer" />
                <label htmlFor="isActive" className={cn("text-sm cursor-pointer", textPrimary)}>Active Mapping</label>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer bg-white">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-bold hover:bg-[#0a348a] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 border-0">
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {editingId ? "Save Changes" : "Create Range"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
