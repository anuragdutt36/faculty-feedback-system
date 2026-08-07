import React, { useState, useEffect } from "react";
import { Plus, Download, Upload, Star, Users, UserCheck, Building2, Trash2, Edit, X, Loader2, BookOpen, AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import {
  ModHeader, ModBtn, ModSearchBar, ModTable, ModTd, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { facultyService } from "../../services/faculty.service.js";
import { academicService } from "../../services/academic.service.js";
import { mappingService } from "../../services/mapping.service.js";
import { analyticsService } from "../../services/analytics.service.js";

interface FacultyMember {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  branchId: {
    _id: string;
    code: string;
    name: string;
  } | null;
  status: "active" | "inactive";
}

export const Faculty: React.FC = () => {
  const { dark } = useTheme();

  // Search & Filter States
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Data States
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);

  // Page Loading States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<FacultyMember | null>(null);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "Computer Science",
    designation: "Assistant Professor",
    branchId: "",
    status: "active" as "active" | "inactive",
  });

  // Deletion State
  const [deleteConfirm, setDeleteConfirm] = useState<FacultyMember | null>(null);

  // Import State
  const [importOpen, setImportOpen] = useState(false);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importStats, setImportStats] = useState({ total: 0, valid: 0, duplicates: 0 });

  // Sidebar details panel (for click on Assigned Subjects)
  const [activeFacultySubjects, setActiveFacultySubjects] = useState<{ name: string; list: string[] } | null>(null);

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
      const facRes = await facultyService.getFacultyList();
      if (facRes?.success) setFaculty(facRes.data);

      const branchRes = await academicService.getBranches();
      if (branchRes?.success) setBranches(branchRes.data);

      const mapRes = await mappingService.getMappings();
      if (mapRes?.success) setMappings(mapRes.data);

      const rankRes = await analyticsService.getFacultyRanking();
      if (rankRes?.success) setRankings(rankRes.data);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load faculty information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-generate employeeId for new profiles
  const openAddModal = () => {
    setEditItem(null);
    const nextNum = faculty.length + 1;
    const generatedId = `FAC-${String(nextNum).padStart(3, "0")}`;
    setForm({
      employeeId: generatedId,
      name: "",
      email: "",
      phone: "",
      department: "Computer Science",
      designation: "Assistant Professor",
      branchId: branches[0]?._id || "",
      status: "active",
    });
    setModalOpen(true);
  };

  const openEditModal = (item: FacultyMember) => {
    setEditItem(item);
    setForm({
      employeeId: item.employeeId,
      name: item.name,
      email: item.email,
      phone: item.phone || "",
      department: item.department || "Computer Science",
      designation: item.designation,
      branchId: item.branchId?._id || "",
      status: item.status,
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.designation) {
      showNotification("error", "Full Name, College Email, and Designation are required.");
      return;
    }

    if (!form.email.toLowerCase().endsWith("@knit.ac.in")) {
      showNotification("error", "Email must be a valid college email ending with @knit.ac.in");
      return;
    }

    setSubmitting(true);
    try {
      if (editItem) {
        // Update Faculty
        await facultyService.updateFaculty(editItem._id, {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          designation: form.designation,
          status: form.status
        });
        showNotification("success", "Faculty profile updated successfully!");
      } else {
        // Create Faculty
        // Check if ID is unique locally
        if (faculty.some(f => f.employeeId === form.employeeId.toUpperCase())) {
          throw new Error("Faculty ID already exists");
        }
        await facultyService.createFaculty({
          employeeId: form.employeeId,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          designation: form.designation,
          status: form.status
        });
        showNotification("success", "Faculty profile created successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to submit faculty details.");
    } finally {
      setSubmitting(false);
    }
  };

  // Direct toggle status directly from the table
  const handleToggleStatus = async (item: FacultyMember) => {
    try {
      const nextStatus = item.status === "active" ? "inactive" : "active";
      const res = await facultyService.updateFaculty(item._id, { status: nextStatus });
      if (res?.success) {
        showNotification("success", `${item.name} is now marked ${nextStatus}.`);
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to toggle status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      // Check Mapping counts
      const hasMappings = mappings.some(m => {
        const fid = m.facultyId && typeof m.facultyId === "object" ? m.facultyId._id : m.facultyId;
        return fid === deleteConfirm._id;
      });
      if (hasMappings) {
        showNotification("error", `Cannot delete ${deleteConfirm.name} because they are actively assigned to subjects. Please mark them as Inactive instead.`);
        setDeleteConfirm(null);
        return;
      }

      await facultyService.deleteFaculty(deleteConfirm._id);
      showNotification("success", "Faculty profile deleted successfully.");
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete faculty member.");
      setDeleteConfirm(null);
    }
  };

  // Debounced Search and drop down filters
  const getFilteredFaculty = () => {
    let list = [...faculty];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(f => {
        const matchingMappings = mappings.filter(m => m.facultyId?._id === f._id && (m.subjectId?.name || "").toLowerCase().includes(q));
        return f.name.toLowerCase().includes(q) ||
               f.email.toLowerCase().includes(q) ||
               (f.phone || "").toLowerCase().includes(q) ||
               matchingMappings.length > 0;
      });
    }

    if (selectedStatus) {
      list = list.filter(f => f.status === selectedStatus);
    }

    return list;
  };

  const filteredFaculty = getFilteredFaculty();

  // Ratings mapping helper
  const getFacultyRating = (id: string) => {
    const rankInfo = rankings.find(r => r.id === id);
    return rankInfo && rankInfo.rating > 0 ? rankInfo.rating : 4.0;
  };

  // Export filtered data to CSV/Excel
  const handleExport = () => {
    if (filteredFaculty.length === 0) {
      showNotification("error", "No data to export.");
      return;
    }
    const headers = ["Name", "Designation", "College Email", "Phone", "Assigned Subjects", "Avg Rating", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredFaculty.map(f => {
        const subjCount = mappings.filter(m => m.facultyId?._id === f._id).length;
        const rating = getFacultyRating(f._id);
        return [
          `"${f.name}"`,
          `"${f.designation}"`,
          `"${f.email}"`,
          `"${f.phone || "—"}"`,
          `"${subjCount} Subjects"`,
          `"${rating}"`,
          `"${f.status}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "faculty_filtered_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("success", `Exported ${filteredFaculty.length} faculty details successfully.`);
  };

  // CSV/Excel file parse preview helper
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFile(file);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) throw new Error("File is empty");

      const parsedRows: any[] = [];
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const idIdx = headers.indexOf("faculty id");
      const nameIdx = headers.indexOf("name");
      const deptIdx = headers.indexOf("department");
      const emailIdx = headers.indexOf("college email");
      const phoneIdx = headers.indexOf("phone");
      const desIdx = headers.indexOf("designation");
      const statusIdx = headers.indexOf("status");

      if (idIdx === -1 || nameIdx === -1 || deptIdx === -1 || emailIdx === -1 || desIdx === -1) {
        throw new Error("Missing headers. Must contain: Faculty ID, Name, Department, College Email, Designation");
      }

      let duplicates = 0;
      let valid = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map(c => c.trim());
        if (cols.length < headers.length) continue;

        const id = cols[idIdx];
        const email = cols[emailIdx];
        const isDupe = faculty.some(f => f.employeeId === id.toUpperCase() || f.email.toLowerCase() === email.toLowerCase());

        if (isDupe) duplicates++;
        else valid++;

        parsedRows.push({
          employeeId: id,
          name: cols[nameIdx],
          branchName: cols[deptIdx],
          email: email,
          phone: phoneIdx !== -1 ? cols[phoneIdx] : "",
          designation: cols[desIdx],
          status: statusIdx !== -1 ? cols[statusIdx] : "active",
          isDupe
        });
      }

      setImportPreview(parsedRows);
      setImportStats({ total: parsedRows.length, valid, duplicates });
    } catch (err: any) {
      showNotification("error", err.message || "Failed to parse import preview.");
      setImportingFile(null);
    }
  };

  const confirmImport = async () => {
    if (!importingFile) return;
    setSubmitting(true);
    try {
      const res = await facultyService.importFaculty(importingFile);
      if (res?.success) {
        showNotification("success", `Successfully imported ${res.data?.count || 0} faculty profiles!`);
        setImportOpen(false);
        setImportingFile(null);
        setImportPreview([]);
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to import faculty file.");
    } finally {
      setSubmitting(false);
    }
  };

  // KPI calculations
  const totalCount = faculty.length;
  const activeCount = faculty.filter(f => f.status === "active").length;
  const uniqueBranches = Array.from(new Set(faculty.map(f => f.branchId?._id).filter(Boolean))).length;
  
  // Calculate average rating across all faculty
  const getOverallRatingAvg = () => {
    const ratedFaculty = faculty.map(f => getFacultyRating(f._id)).filter(r => r > 0);
    if (ratedFaculty.length === 0) return "4.1";
    const sum = ratedFaculty.reduce((a, b) => a + b, 0);
    return (sum / ratedFaculty.length).toFixed(1);
  };

  return (
    <div>
      <ModHeader title="Faculty Management" sub="Add, edit, and manage all faculty profiles for feedback collections" dark={dark}>
        <ModBtn icon={Plus} variant="primary" onClick={openAddModal}>Add Faculty</ModBtn>
        <ModBtn icon={Download} variant="outline" onClick={handleExport}>Export</ModBtn>
        <ModBtn icon={Upload} variant="outline" onClick={() => setImportOpen(true)}>Import Faculty</ModBtn>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Faculty", value: totalCount, icon: Users, color: "bg-[#0B3D91]" },
          { label: "Active Faculty", value: activeCount, icon: UserCheck, color: "bg-emerald-500" },
          { label: "Departments", value: uniqueBranches || branches.length, icon: Building2, color: "bg-[#3B82F6]" },
          { label: "Avg Rating", value: `${getOverallRatingAvg()} ★`, icon: Star, color: "bg-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={cn("rounded-2xl p-5 border", cardBg)}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}><Icon size={18} className="text-white" /></div>
            <div className={cn("text-2xl font-bold mb-0.5", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
            <div className={cn("text-xs", textSub)}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-4">
        <ModSearchBar dark={dark} placeholder="Search by name, email or phone…" value={search} onChange={setSearch} />
        
        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer w-full sm:w-auto", dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Status</option>
          <option value="active" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Active</option>
          <option value="inactive" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Inactive</option>
        </select>

        {(selectedStatus || search) && (
          <button onClick={() => { setSelectedStatus(""); setSearch(""); setCurrentPage(1); }} className="text-xs font-bold text-red-500 hover:underline cursor-pointer border-0 bg-transparent">Clear Filters</button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-[#0B3D91]" />
          <p className={cn("text-sm mt-3 font-medium", textSub)}>Loading faculty database...</p>
        </div>
      ) : (
        <ModTable
          dark={dark}
          headers={["Name", "Designation", "College Email", "Phone", "Assigned Subjects", "Avg Rating", "Status", "Actions"]}
          totalCount={filteredFaculty.length}
          page={currentPage}
          onPageChange={setCurrentPage}
        >
          {filteredFaculty.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-xs font-semibold text-gray-400">No faculty records found.</td>
            </tr>
          ) : (
            filteredFaculty.slice((currentPage - 1) * 10, currentPage * 10).map((r) => {
              const facultyMappings = mappings.filter(m => m.facultyId?._id === r._id);
              const subjectNames = facultyMappings.map(m => `${m.subjectId?.code || "SUB"}: ${m.subjectId?.name || "N/A"}`);
              const rating = getFacultyRating(r._id);
              return (
                <tr key={r._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                  <ModTd>
                    <span className={cn("font-bold text-sm", textPrimary)}>{r.name}</span>
                  </ModTd>
                  <ModTd><span className={textSub}>{r.designation}</span></ModTd>
                  <ModTd><span className={textSub}>{r.email}</span></ModTd>
                  <ModTd><span className={textSub}>{r.phone || "—"}</span></ModTd>
                  <ModTd>
                    <button
                      onClick={() => facultyMappings.length > 0 && setActiveFacultySubjects({ name: r.name, list: subjectNames })}
                      className={cn(
                        "text-xs font-bold underline transition-colors cursor-pointer border-0 bg-transparent",
                        facultyMappings.length > 0
                          ? "text-[#0B3D91] dark:text-blue-400 hover:text-[#0a348a]"
                          : "text-gray-400 cursor-not-allowed no-underline"
                      )}
                    >
                      {facultyMappings.length} Subjects
                    </button>
                  </ModTd>
                  <ModTd>
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className={cn("font-bold", textPrimary)}>{rating}</span>
                    </div>
                  </ModTd>
                  <ModTd>
                    <button
                      onClick={() => handleToggleStatus(r)}
                      title="Click to toggle status"
                      className="cursor-pointer border-0 bg-transparent text-left"
                    >
                      <Badge variant={r.status === "active" ? "success" : "error"}>
                        {r.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </ModTd>
                  <ModTd>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(r)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"><Edit size={14} /></button>
                      <button onClick={() => setDeleteConfirm(r)} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"><Trash2 size={14} /></button>
                    </div>
                  </ModTd>
                </tr>
              );
            })
          )}
        </ModTable>
      )}

      {/* --- Add / Edit Faculty Modal --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {editItem ? "Edit" : "Create"} Faculty Member
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Faculty ID, Department, and Branch fields have been removed per user request */}

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Sharma"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>College Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@knit.ac.in"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +91-9876543210"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Department and Branch fields removed */}

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Designation</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                >
                  {["Assistant Professor", "Associate Professor", "Professor", "Guest Faculty", "Head of Department"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
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
                  {editItem ? "Save Changes" : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Deletion Confirmation Dialog --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-sm shadow-2xl relative text-center",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <h4 className={cn("text-base font-bold mb-2", textPrimary)}>Confirm Deletion</h4>
            <p className={cn("text-xs mb-6", textSub)}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer border-0"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Clickable Assigned Subjects Drawer Panel --- */}
      {activeFacultySubjects && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className={cn(
            "w-80 h-full p-6 shadow-2xl relative flex flex-col justify-between animate-in slide-in-from-right duration-300",
            dark ? "bg-[#132052] border-l border-white/10 text-white" : "bg-white border-l border-gray-100 text-[#0D1B3E]"
          )}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Assigned Subjects</h4>
                <button onClick={() => setActiveFacultySubjects(null)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
              </div>
              <p className={cn("text-xs font-medium mb-4", textSub)}>Subject mapping for <strong>{activeFacultySubjects.name}</strong>:</p>
              <div className="space-y-2">
                {activeFacultySubjects.list.map((sub, i) => (
                  <div key={i} className={cn("p-3 rounded-xl border text-xs font-semibold flex items-center gap-2", dark ? "bg-white/5 border-white/10" : "bg-[#EEF2F8] border-[#0B3D91]/10")}>
                    <BookOpen size={14} className="text-[#0B3D91] dark:text-blue-400" />
                    <span>{sub}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveFacultySubjects(null)}
              className="w-full py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-bold hover:bg-[#0a348a] cursor-pointer border-0"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}

      {/* --- Import Faculty Dialog --- */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Import Faculty Profiles
              </h3>
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportingFile(null);
                  setImportPreview([]);
                }}
                className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {!importingFile ? (
                <div className={cn("border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center", dark ? "border-white/10 bg-white/5" : "border-[#0B3D91]/10 bg-[#EEF2F8]")}>
                  <Upload size={32} className="text-gray-400 mb-3" />
                  <p className={cn("text-xs font-bold mb-1.5", textPrimary)}>Choose CSV or Excel sheet to upload</p>
                  <p className="text-[10px] text-gray-400 mb-4">Required columns: Faculty ID, Name, Department, College Email, Designation</p>
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept=".csv, .xlsx"
                      className="hidden"
                      onChange={handleImportFileChange}
                    />
                    <div className="px-4 py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#0a348a] text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-[#0B3D91]/20">
                      Select File
                    </div>
                  </label>
                </div>
              ) : (
                <>
                  <div className={cn("p-4 rounded-xl flex items-center justify-between", dark ? "bg-white/5" : "bg-[#EEF2F8]")}>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-[#3B82F6]" />
                      <div className="text-left">
                        <p className={cn("text-xs font-bold", textPrimary)}>{importingFile.name}</p>
                        <p className="text-[10px] text-gray-400">{(importingFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setImportingFile(null);
                        setImportPreview([]);
                      }}
                      className="text-xs font-bold text-red-500 hover:underline cursor-pointer border-0 bg-transparent"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: "Total Rows", val: importStats.total, color: textPrimary },
                      { label: "New / Valid", val: importStats.valid, color: "text-emerald-500" },
                      { label: "Duplicates", val: importStats.duplicates, color: "text-amber-500" }
                    ].map(({ label, val, color }) => (
                      <div key={label} className={cn("p-3 rounded-xl border text-center", dark ? "bg-white/5 border-white/10" : "bg-[#F8FAFD] border-[#0B3D91]/10")}>
                        <div className={cn("text-base font-bold", color)}>{val}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Preview list */}
                  <div className={cn("max-h-48 overflow-y-auto border rounded-xl divide-y", dark ? "border-white/10 divide-white/5" : "border-gray-150 divide-gray-100")}>
                    {importPreview.map((row, idx) => (
                      <div key={idx} className="p-3 text-left flex items-start justify-between text-[11px]">
                        <div>
                          <p className={cn("font-bold", textPrimary)}>{row.name} ({row.employeeId})</p>
                          <p className="text-gray-400">{row.email} · {row.branchName} · {row.designation}</p>
                        </div>
                        {row.isDupe ? (
                          <Badge variant="warning">Duplicate (Will Update)</Badge>
                        ) : (
                          <Badge variant="success">New</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setImportOpen(false);
                        setImportingFile(null);
                        setImportPreview([]);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmImport}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-bold hover:bg-[#0a348a] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 border-0"
                    >
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      Import Now
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;
