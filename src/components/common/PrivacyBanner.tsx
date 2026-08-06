import React from "react";
import { ShieldCheck } from "lucide-react";
import { useSettings } from "../../context/SettingsContext.js";

interface PrivacyBannerProps {
  compact?: boolean;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ compact = false }) => {
  const { anonymousFeedback } = useSettings();

  if (!anonymousFeedback) {
    return (
      <div className={`flex items-start gap-3 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}>
        <ShieldCheck size={compact ? 14 : 16} className="mt-0.5 shrink-0 text-blue-600" />
        <p className={`leading-relaxed text-blue-800 ${compact ? "text-[11px]" : "text-xs"}`}>
          <span className="font-semibold">Your feedback is securely recorded.</span>{" "}
          {compact
            ? "Your identity is recorded by the administration."
            : "Your student identity is recorded for internal monitoring purposes."}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl border bg-violet-50 border-violet-200 text-violet-800 ${
      compact ? "px-3 py-2.5" : "px-4 py-3"
    }`}>
      <ShieldCheck size={compact ? 14 : 16} className="mt-0.5 shrink-0 text-violet-600" />
      <p className={`leading-relaxed text-violet-800 ${compact ? "text-[11px]" : "text-xs"}`}>
        <span className="font-semibold">Your feedback is completely anonymous.</span>{" "}
        {compact
          ? "Your identity is never linked to your responses."
          : "Faculty members, HODs, and administrators cannot identify your individual responses. Your login is used only to verify eligibility and prevent duplicate submissions."}
      </p>
    </div>
  );
};

export default PrivacyBanner;
