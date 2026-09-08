import React, { useState, useEffect } from "react";
import { User, Building2, Mail, ShieldCheck, Lock, KeyRound, Shield, CheckCircle2, GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { apiFetch } from "../../services/api.js";
import { ChangePasswordCard } from "../../components/common/ChangePasswordCard.js";

export const DeanHodProfile: React.FC = () => {
  const { user } = useAuth();
  const isDean = user?.role === "dean";
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/profiles/me");
        if (res?.success && res.data?.profile) {
          setProfileData(res.data.profile);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const displayName = profileData?.name || user?.name || (isDean ? "Dean of Academic Affairs" : "Head of Department");
  const departmentName = profileData?.department || (profileData?.branchId?.name) || user?.department || (isDean ? "Institutional Scope" : "Department");
  const employeeId = profileData?.employeeId || user?.employeeId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isDean ? "Dean Profile & Settings" : "HOD Profile & Settings"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/70 mt-1">
            Your official academic governance credentials, administrative scope, and account security.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-white dark:bg-[#0B3D91] text-[#0B3D91] dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User size={13} />
            <span>Governance Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-white dark:bg-[#0B3D91] text-[#0B3D91] dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <KeyRound size={13} />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md">
                {displayName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {displayName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 inline-flex items-center gap-1">
                    <CheckCircle2 size={10} /> Authorized {isDean ? "Dean" : "HOD"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#0B3D91] dark:text-blue-400 mt-1">
                  {isDean ? "Dean (Institution Scope)" : `Head of Department — ${departmentName}`}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {employeeId && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      ID: {employeeId}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg text-[11px] text-slate-700 dark:text-slate-300">
                    <Mail size={12} className="text-[#0B3D91] dark:text-blue-400" /> {user?.username}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#0B3D91] dark:text-blue-300">
                    <Building2 size={12} /> {isDean ? "All Academic Departments" : departmentName}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Governance Scope Policy:</span>{" "}
                {isDean
                  ? "As Dean, your access permits viewing aggregated evaluation metrics, ranking distributions, and comparative trends across all authorized academic units. System settings, authentication config, and audit logs are managed by System Administrators."
                  : "As Head of Department, your access is strictly scoped to faculty and subjects within your assigned department. System configurations and global audit logs remain restricted to Administrators."}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ChangePasswordCard
            title={isDean ? "Change Dean Account Password" : "Change HOD Account Password"}
            description={`Update your ${isDean ? "Dean" : "HOD"} portal password. Next time you sign in, use your email and new password.`}
          />

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Shield className="w-4 h-4 text-[#0B3D91] dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Governance Security:</span>{" "}
              Keep your credentials confidential. If you require assistance, your institutional administrator can update or reset your credentials from the Administrator Faculty panel.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanHodProfile;
