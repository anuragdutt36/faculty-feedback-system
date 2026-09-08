import React from "react";
import { User, Building2, Mail, ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";

export const DeanHodProfile: React.FC = () => {
  const { user } = useAuth();
  const isDean = user?.role === "dean";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isDean ? "Dean Profile" : "HOD Profile"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/70 mt-1">
          Your official academic governance credentials and scope assignments.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md">
            {user?.name ? user.name.charAt(0) : "A"}
          </div>
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {user?.name || (isDean ? "Dean of Academic Affairs" : "Head of Department")}
            </h2>
            <p className="text-xs font-semibold text-[#0B3D91] dark:text-blue-400 mt-0.5">
              {isDean ? "Dean (Academic Scope)" : `HOD — ${user?.department || "Computer Science & Engineering"}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-md text-[11px]">
                <Mail size={12} /> {user?.username}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
          <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Governance Scope Policy:</span>{" "}
            {isDean
              ? "As Dean, your access permits viewing aggregated evaluation metrics across all authorized academic units. System settings, authentication config, and audit logs are managed by System Administrators."
              : "As Head of Department, your access is strictly scoped to your assigned department. System configurations and global audit logs remain restricted to Administrators."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeanHodProfile;
