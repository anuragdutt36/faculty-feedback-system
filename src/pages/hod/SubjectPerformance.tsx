import React, { useState, useEffect } from "react";
import { BookOpen, Star, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { apiFetch } from "../../services/api.js";

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: string;
  facultyName: string;
  responseCount: number;
  overallScore: number;
}

export const SubjectPerformance: React.FC = () => {
  const { user } = useAuth();
  const isDean = user?.role === "dean";
  const [search, setSearch] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await apiFetch("/academic/subjects");
        if (data?.success && Array.isArray(data.data)) {
          const mapped = data.data.map((s: any) => ({
            id: s._id || s.id,
            code: s.code || "SUB-000",
            name: s.name,
            department: (s.branchId as any)?.name || "General",
            semester: s.semester ? `Semester ${s.semester}` : "Semester 1",
            facultyName: (s.facultyId as any)?.name || "Assigned Faculty",
            responseCount: s.responseCount || 0,
            overallScore: s.overallScore || 0
          }));
          setSubjects(mapped);
        }
      } catch (err) {
        console.error("Failed to load subject performance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const filtered = subjects.filter(
    (s) =>
      (!isDean && user?.department ? s.department.toLowerCase() === user.department.toLowerCase() : true) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
  );

  const emptyMsg = isDean
    ? "No subject performance data is available across your assigned scope."
    : "No subject performance data is available for this department.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subject Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/70 mt-1">
            Course coverage ratings and pedagogical parameter metrics by subject.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-500/20">
          <ShieldCheck size={16} />
          <span>Aggregated Course Metrics</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject code or title..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {emptyMsg}
          </h3>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3.5 sm:p-4">Subject Code &amp; Title</th>
                  <th className="p-3.5 sm:p-4">Semester</th>
                  <th className="p-3.5 sm:p-4">Department</th>
                  <th className="p-3.5 sm:p-4">Faculty Instructor</th>
                  <th className="p-3.5 sm:p-4 text-center">Responses</th>
                  <th className="p-3.5 sm:p-4 text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white">
                      <div>{item.name}</div>
                      <div className="text-[11px] font-mono text-[#0B3D91] dark:text-blue-400">{item.code}</div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-600 dark:text-slate-300">{item.semester}</td>
                    <td className="p-3.5 sm:p-4 text-slate-600 dark:text-slate-300">{item.department}</td>
                    <td className="p-3.5 sm:p-4 font-medium">{item.facultyName}</td>
                    <td className="p-3.5 sm:p-4 text-center font-semibold text-slate-600 dark:text-slate-400">
                      {item.responseCount}
                    </td>
                    <td className="p-3.5 sm:p-4 text-right font-bold text-[#0B3D91] dark:text-blue-400">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {item.overallScore.toFixed(1)} / 5.0
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPerformance;
