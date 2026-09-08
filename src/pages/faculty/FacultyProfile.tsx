import React, { useState, useEffect } from "react";
import { User, Building2, BookOpen, ShieldCheck, Mail, Phone, Lock, Calendar, GraduationCap, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { apiFetch } from "../../services/api.js";

interface AssignedSubject {
  id?: string;
  code: string;
  name: string;
  semester: string;
  course?: string;
  branch?: string;
  academicYear?: string;
}

interface ProfileDetails {
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  email: string;
  phone?: string;
  academicScope?: string;
  subjects: AssignedSubject[];
}

export const FacultyProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDetails>({
    name: user?.name || "Prof. Aditya Gupta",
    employeeId: user?.employeeId || "FAC-035",
    department: user?.department || "Computer Science",
    designation: "Assistant Professor",
    email: user?.username || "aditya@knit.ac.in",
    phone: "+91 9876543210",
    academicScope: "Computer Science Department",
    subjects: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/profiles/me");
        if (res?.success && res.data?.profile) {
          const p = res.data.profile;
          setProfile({
            name: p.name || "Faculty Member",
            employeeId: p.employeeId || "FAC-035",
            department: p.department || (p.branchId?.name) || "Computer Science",
            designation: p.designation || "Assistant Professor",
            email: p.email || user?.username || "",
            phone: p.phone || "+91 9876543210",
            academicScope: p.academicScope || "Department Faculty",
            subjects: Array.isArray(p.subjects) ? p.subjects : []
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Faculty Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/70 mt-1">
          Your official institutional profile and assigned academic courses.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {profile.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 inline-flex items-center gap-1">
                <CheckCircle2 size={10} /> Active Faculty
              </span>
            </div>
            <p className="text-xs font-semibold text-[#0B3D91] dark:text-blue-400 mt-1">
              {profile.designation} &nbsp;•&nbsp; {profile.department}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                ID: {profile.employeeId}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg text-[11px] text-slate-700 dark:text-slate-300">
                <Mail size={12} className="text-[#0B3D91] dark:text-blue-400" /> {profile.email}
              </span>
              {profile.academicScope && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#0B3D91] dark:text-blue-300">
                  <GraduationCap size={12} /> {profile.academicScope}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Subjects Section */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={16} className="text-[#0B3D91] dark:text-blue-400" />
              <span>Assigned Subjects</span>
              {profile.subjects.length > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-[#0B3D91] dark:text-blue-300">
                  {profile.subjects.length} {profile.subjects.length === 1 ? "Subject" : "Subjects"}
                </span>
              )}
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Official Administrator Assignment
            </span>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0B3D91]" />
            </div>
          ) : profile.subjects.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs text-slate-500">
              No academic subject mappings currently assigned by institution administrator.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {profile.subjects.map((s, idx) => (
                <div
                  key={`${s.code}_${idx}`}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 hover:border-[#0B3D91]/30 dark:hover:border-blue-500/30 transition-all flex items-start gap-3.5 shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B3D91] to-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs">
                    {s.code.substring(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100/80 dark:bg-blue-500/20 text-[#0B3D91] dark:text-blue-300">
                        {s.code}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        ● Assigned
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                      {s.name}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-blue-200/70 mt-1 flex items-center gap-1.5 font-medium">
                      <span>{s.semester}</span>
                      <span>•</span>
                      <span>{s.academicYear || "2025-26"}</span>
                    </p>
                    {(s.course || s.branch) && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                        {s.course} {s.branch ? `(${s.branch})` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Read-only Security Notice */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
          <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Institutional Mapping Control:</span>{" "}
            Faculty designations, department assignments, and subject mappings are managed directly by institutional administrators to ensure statutory integrity.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfile;
