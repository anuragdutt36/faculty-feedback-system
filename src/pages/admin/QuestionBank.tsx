import React, { useState, useEffect } from "react";
import { Plus, Eye, Trash2, Edit, X, Loader2, Star, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import {
  ModSearchBar, ModTable, ModTd,
  ModStatusBadge, ModBtn, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { questionService } from "../../services/question.service.js";

interface QuestionItem {
  _id: string;
  code: string;
  text: string;
  category: string;
  weight: number;
  status: "active" | "inactive";
  order: number;
}

export const QuestionBank: React.FC = () => {
  const { dark } = useTheme();
  const { instituteName } = useSettings();
  
  // Data States
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<QuestionItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Custom Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    code: "",
    text: "",
    category: "Teaching Effectiveness",
    weight: 1.0,
    status: "active" as "active" | "inactive",
    order: 1
  });

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";
  const inputCls = dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]";

  const categories = [
    "All",
    "Teaching Effectiveness",
    "Communication",
    "Classroom Management",
    "Subject Knowledge",
    "Assessment",
    "Student Interaction",
    "Professionalism"
  ];

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await questionService.getQuestions();
      if (res?.success) {
        setQuestions(res.data || []);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditItem(null);
    
    // Generate next Q code recommendation
    const nextNum = questions.length + 1;
    const nextCode = `Q${String(nextNum).padStart(2, "0")}`;

    setForm({
      code: nextCode,
      text: "",
      category: "Teaching Effectiveness",
      weight: 1.0,
      status: "active",
      order: nextNum
    });
    setModalOpen(true);
  };

  const openEditModal = (item: QuestionItem) => {
    setEditItem(item);
    setForm({
      code: item.code || "",
      text: item.text,
      category: item.category,
      weight: item.weight,
      status: item.status,
      order: item.order || 1
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.text.trim() || !form.category) {
      showNotification("error", "Question Code, Text, and Category are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editItem) {
        await questionService.updateQuestion(editItem._id, form);
        showNotification("success", "Question updated successfully!");
      } else {
        await questionService.createQuestion(form);
        showNotification("success", "Question added to bank successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to submit question.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await questionService.deleteQuestion(deleteId);
      showNotification("success", "Question deleted successfully.");
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete question.");
    } finally {
      setDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  // Filter local logic
  const getFilteredQuestions = () => {
    return questions.filter(q => {
      const matchCat = activeCategory === "All" || q.category === activeCategory;
      
      const query = debouncedSearch.toLowerCase().trim();
      const matchSearch = !query ||
        q.text.toLowerCase().includes(query) ||
        (q.code || "").toLowerCase().includes(query) ||
        q.category.toLowerCase().includes(query);

      return matchCat && matchSearch;
    });
  };

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: categories filter panel */}
        <div className={cn("rounded-2xl border p-4 h-fit", cardBg)}>
          <p className={cn("text-xs font-bold uppercase tracking-widest mb-3", textSub)}>Categories</p>
          <div className="space-y-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-0 cursor-pointer flex justify-between items-center",
                  activeCategory === cat
                    ? "bg-[#0B3D91] text-white"
                    : dark
                      ? "text-white/60 hover:bg-white/8 hover:text-white bg-transparent"
                      : "text-[#5A6E8E] hover:bg-[#EEF2F8] hover:text-[#0D1B3E] bg-transparent"
                )}
              >
                <span>{cat}</span>
                <span className="opacity-60 text-[10px]">
                  {cat === "All" ? questions.length : questions.filter(q => q.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: questions table repository */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className={cn("text-2xl font-bold", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Question Bank</h1>
              <p className={cn("text-sm mt-0.5", textSub)}>Configure the student evaluation forms</p>
            </div>
            <div className="flex gap-2">
              <ModBtn icon={Plus} variant="primary" onClick={openAddModal}>Add Question</ModBtn>
              <ModBtn icon={Eye} variant="outline" onClick={() => setPreviewOpen(true)}>Preview Form</ModBtn>
            </div>
          </div>

          <div className="max-w-md">
            <ModSearchBar dark={dark} placeholder="Search by question code, text, or category…" value={search} onChange={setSearch} />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="animate-spin text-[#0B3D91]" />
              <p className={cn("text-sm mt-3 font-medium", textSub)}>Loading question repository...</p>
            </div>
          ) : (
            <ModTable
              dark={dark}
              headers={["Code", "Question Text", "Category", "Weight", "Status", "Actions"]}
              totalCount={filteredQuestions.length}
              empty={filteredQuestions.length === 0}
              page={currentPage}
              onPageChange={setCurrentPage}
            >
              {filteredQuestions.slice((currentPage - 1) * 10, currentPage * 10).map((r, i) => (
                <tr key={r._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                  <ModTd><span className="font-mono text-gray-400 font-bold">{r.code || `Q${String(r.order || i+1).padStart(2, "0")}`}</span></ModTd>
                  <ModTd className="max-w-xs md:max-w-md"><span className={cn("font-medium leading-snug break-words", textPrimary)} style={{ whiteSpace: "normal" }}>{r.text}</span></ModTd>
                  <ModTd><Badge>{r.category}</Badge></ModTd>
                  <ModTd><span className={cn("font-bold", textPrimary)}>{r.weight.toFixed(1)}×</span></ModTd>
                  <ModTd><ModStatusBadge status={r.status} /></ModTd>
                  <ModTd>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete(r._id)}
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

      {/* --- Add/Edit Question Modal Overlay --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {editItem ? "Edit" : "Add"} Feedback Question
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q01"
                    className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none font-mono", inputCls)}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="col-span-2">
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Display Order</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Question Text</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. The instructor explains concepts clearly..."
                  className={cn("w-full px-3 py-2 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Category</label>
                <select
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", inputCls)}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Weight Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5.0"
                    required
                    className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Status</label>
                  <select
                    className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", inputCls)}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Custom Dark Delete Confirmation Modal --- */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-sm shadow-2xl relative text-center space-y-4 animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]"
          )}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Delete Question?</h3>
              <p className={cn("text-xs mt-1 leading-relaxed", textSub)}>
                Are you sure you want to delete this question? This will permanently remove it from the Question Bank and all future feedback evaluations.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer bg-white"
              >
                No, Keep It
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer border-0"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Live Evaluation Form Preview Modal --- */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#0c163b] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5 border-b pb-3" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
              <div>
                <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Feedback Form Preview
                </h3>
                <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-0.5"><Info size={10} /> Preview Mode: Responses cannot be submitted.</span>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>

            <div className="space-y-6">
              {/* Form header */}
              <div className={cn("p-4 rounded-2xl border text-center", dark ? "bg-white/5 border-white/10" : "bg-[#F8FAFD] border-[#0B3D91]/8")}>
                <h4 className={cn("font-extrabold text-base text-[#0B3D91] dark:text-blue-400 uppercase")}>{instituteName}</h4>
                <p className={cn("text-xs mt-1 font-semibold", textPrimary)}>Student Feedback Evaluation Form</p>
                <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-400">
                  <span>Course: <b className="text-gray-500">MCA / B.Tech</b></span>
                  <span>Semester: <b className="text-gray-500">Active Semester</b></span>
                </div>
              </div>

              {/* Mapped questions grouped by category */}
              <div className="space-y-6">
                {questions.filter(q => q.status === "active").length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">No active questions to display.</p>
                ) : (
                  // Group by category
                  Array.from(new Set(questions.filter(q => q.status === "active").map(q => q.category))).map(cat => (
                    <div key={cat} className="space-y-3">
                      <h5 className="text-xs font-bold text-blue-500 tracking-wider uppercase border-b pb-1" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>{cat}</h5>
                      <div className="space-y-4">
                        {questions.filter(q => q.status === "active" && q.category === cat).map((q, idx) => (
                          <div key={q._id} className="text-xs space-y-2">
                            <p className={cn("font-semibold leading-normal", textPrimary)}>
                              <span className="text-gray-400 font-mono font-semibold mr-2">{q.code || `Q${idx + 1}`}</span>
                              {q.text} <span className="text-red-500">*</span>
                            </p>
                            
                            {/* All questions are rating based */}
                            <div className="flex gap-2 justify-between max-w-sm mt-1">
                              {[1, 2, 3, 4, 5].map(val => (
                                <label key={val} className="flex flex-col items-center gap-1 cursor-pointer">
                                  <input type="radio" disabled name={`q_${q._id}`} className="accent-[#0B3D91]" />
                                  <span className={cn("font-medium text-[10px]", textSub)}>{val}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Submit button (disabled) */}
              <div className="border-t pt-4 flex justify-end" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
                <button
                  type="button"
                  disabled
                  className="px-6 py-2.5 rounded-xl bg-gray-400 text-white text-xs font-bold cursor-not-allowed border-0"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
