import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { authService } from "../../services/auth.service.js";

interface ChangePasswordCardProps {
  title?: string;
  description?: string;
  className?: string;
  onSuccess?: () => void;
}

export const ChangePasswordCard: React.FC<ChangePasswordCardProps> = ({
  title = "Change Password",
  description = "Ensure your institutional account uses a strong, secure password with at least 6 characters.",
  className = "",
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isPasswordValid = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setNotification({ type: "error", message: "All fields are required." });
      return;
    }

    if (newPassword.length < 6) {
      setNotification({ type: "error", message: "New password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification({ type: "error", message: "New password and confirmation do not match." });
      return;
    }

    if (currentPassword === newPassword) {
      setNotification({ type: "error", message: "New password must be different from your current password." });
      return;
    }

    setLoading(true);

    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      if (res?.success) {
        setNotification({
          type: "success",
          message: "Password changed successfully! Next time you sign in, use your new password.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (onSuccess) onSuccess();
      } else {
        setNotification({
          type: "error",
          message: res?.message || "Failed to change password. Please verify your current password.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to change password. Please verify your current password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3.5 pb-5 border-b border-slate-100 dark:border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B3D91] to-[#3B82F6] flex items-center justify-center text-white shrink-0 shadow-xs">
          <KeyRound size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-[#0B3D91] dark:text-blue-300">
              Security
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-blue-200/70 mt-0.5">
            {description}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-xl">
        {notification && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-300"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-medium">{notification.message}</span>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Current Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={15} />
            </div>
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current account password"
              required
              className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={15} />
            </div>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter at least 6 characters"
              required
              minLength={6}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {newPassword && (
            <p className={`text-[11px] mt-1 flex items-center gap-1 ${isPasswordValid ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-amber-600 dark:text-amber-400"}`}>
              {isPasswordValid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              <span>{isPasswordValid ? "Minimum length requirement satisfied" : "Must be at least 6 characters long"}</span>
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={15} />
            </div>
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {confirmPassword && (
            <p className={`text-[11px] mt-1 flex items-center gap-1 ${isMatch ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-red-600 dark:text-red-400"}`}>
              {isMatch ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              <span>{isMatch ? "Passwords match" : "Passwords do not match"}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword || !isPasswordValid || !isMatch}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B3D91] hover:bg-[#093276] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordCard;
