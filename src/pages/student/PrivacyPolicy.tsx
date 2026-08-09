import React from "react";
import {
  Lock, Fingerprint, SquareCheck, Shield, ScrollText, Database,
  Eye, ShieldCheck, FileWarning, Mail, UserX, X, Network, Award
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";

export const PrivacyPolicy: React.FC = () => {
  const { dark } = useTheme();
  const { systemName, instituteName } = useSettings();

  const steps = [
    { num: 1, title: "Student Logs In", desc: "Eligibility verified using secure Google Sign-In domain checks. Only official institution accounts are allowed.", color: "bg-[#0B3D91]" },
    { num: 2, title: "Eligibility Verified", desc: "The system checks that the student is enrolled in the current semester and has not already submitted feedback for this session.", color: "bg-[#3B82F6]" },
    { num: 3, title: "Anonymous Token Generated", desc: "A one-time cryptographic token is created. This token has no connection to the student's identity in any database table.", color: "bg-violet-500" },
    { num: 4, title: "Feedback Stored Anonymously", desc: "Responses are persisted using only the anonymous token. The student's credentials, name, roll number, and IP address are never written to the feedback record.", color: "bg-emerald-500" },
    { num: 5, title: "Reports from Aggregated Data Only", desc: "Faculty and administrators see only averaged scores and grade distributions — never individual responses or identifiers.", color: "bg-amber-500" },
  ];

  const securityFeatures = [
    { icon: Lock, title: "Encrypted Communication", desc: "All data between your browser and the server is encrypted via HTTPS/TLS 1.3." },
    { icon: Fingerprint, title: "Secure Authentication", desc: "Authentication is managed via Google OAuth 2.0. No password databases are maintained for students." },
    { icon: SquareCheck, title: "One-Time Submission", desc: "The system records only that a submission was made — not what was submitted — to prevent duplicates while preserving anonymity." },
    { icon: Shield, title: "Role-Based Access Control", desc: "Students and admins each see only the data their role permits. Faculty cannot see raw submissions." },
    { icon: ScrollText, title: "Audit Logging", desc: "All administrative actions are logged with timestamps. No student-facing actions are traceable to a specific student." },
    { icon: Database, title: "Tamper-Resistant Records", desc: "Submitted feedback records are immutable. No administrator or faculty member can alter, delete, or access individual submissions." },
  ];

  const rights = [
    { icon: Eye, title: "View Submission Status", desc: "You can see which subjects you have submitted feedback for in the current session via your Feedback History page." },
    { icon: ShieldCheck, title: "Know Your Identity Is Protected", desc: "You have the right to be informed that your identity is never linked to your feedback responses, by system design." },
    { icon: FileWarning, title: "Report Privacy Concerns", desc: "If you believe your anonymity has been compromised, you can report it directly to the institute's Data Protection Officer." },
    { icon: Mail, title: "Contact the Administrator", desc: "You may contact the system administrator for any queries related to data handling." },
  ];

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const border = dark ? "border-white/8" : "border-[#0B3D91]/8";
  const cardBg = dark ? "bg-white/5" : "bg-white";
  const sectionHeaderBg = dark ? "bg-white/4" : "bg-[#F8FAFD]";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className={`text-xl sm:text-2xl font-bold ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Privacy Policy</h1>
        <p className={`text-xs sm:text-sm ${textSub} mt-0.5`}>How your feedback and personal information are protected</p>
        <p className="text-[10px] text-[#5A6E8E] mt-1">Last updated: July 29, 2025 &nbsp;·&nbsp; Effective: Even Semester 2025</p>
      </div>

      {/* Hero Shield Card */}
      <div className="rounded-2xl p-4 sm:p-6 border border-violet-200 overflow-hidden relative" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" }}>
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-violet-200/40" />
        <div className="absolute -right-2 bottom-4 w-20 h-20 rounded-full bg-violet-300/20" />
        <div className="relative z-10 flex items-start gap-3.5 sm:gap-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
            <ShieldCheck size={24} className="text-white sm:w-[30px] sm:h-[30px]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-violet-900 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your Feedback Is Anonymous</h2>
            <p className="text-sm text-violet-700 leading-relaxed max-w-lg">
              Your identity is never linked with your submitted feedback. The system uses Google Sign-In only to verify eligibility and prevent duplicate submissions. Once verified, all connection between your identity and your responses is permanently severed.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Zero Identity Exposure", "Encrypted Storage", "NAAC Compliant", "By Design"].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-violet-200/60 text-violet-800 text-[10px] font-semibold border border-violet-300/50">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Information Collected */}
      <div className={`rounded-2xl border ${border} ${cardBg} shadow-sm overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${dark ? "border-white/5" : "border-[#0B3D91]/6"} ${sectionHeaderBg} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg ${dark ? "bg-white/5" : "bg-[#EEF2F8]"} flex items-center justify-center`}><Database size={14} className="text-[#0B3D91]" /></div>
          <span className={`font-bold ${textPrimary} text-sm`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Information We Collect</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: "Google Email Credentials", desc: "College email verify access and registration status. Email is not stored anywhere inside feedback database records." },
            { label: "Course & Section Assignment", desc: "Your enrolled subjects, semester, section, and department — sourced from the student database to determine which feedback forms you should see." },
            { label: "Submission Status", desc: "A boolean flag (submitted / not submitted) per subject per session — stored separately from all feedback content, to prevent duplicate submissions only." },
          ].map(({ label, desc }) => (
            <div key={label} className={`flex gap-3 p-3.5 rounded-xl border ${dark ? "bg-white/3 border-white/5" : "bg-[#F8FAFD] border-[#0B3D91]/6"}`}>
              <ShieldCheck size={15} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className={`text-xs font-semibold ${textPrimary}`}>{label}</p>
                <p className="text-xs text-[#5A6E8E] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What Is NOT Stored */}
      <div className={`rounded-2xl border ${dark ? "border-red-500/20" : "border-red-100"} ${cardBg} shadow-sm overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${dark ? "border-red-500/20 bg-red-950/20 text-red-300" : "border-red-100 bg-red-50 text-red-800"} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg ${dark ? "bg-red-950/50" : "bg-red-100"} flex items-center justify-center`}><UserX size={14} className="text-red-600" /></div>
          <span className="font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>What Is Never Stored With Your Feedback</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            "Roll number linked to any feedback response",
            "Name or student ID with feedback records",
            "Google email in feedback database tables",
            "IP address in reports or feedback responses",
            "Device information or browser fingerprint",
            "Login timestamp in feedback records",
            "Session token or authentication data",
            "Location or geolocation data",
          ].map(item => (
            <div key={item} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
              dark ? "bg-red-950/10 border-red-900/30 text-red-400" : "bg-red-50/60 border-red-100 text-red-800"
            }`}>
              <X size={13} className="text-red-500 mt-0.5 shrink-0" />
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Anonymous Process Timeline */}
      <div className={`rounded-2xl border ${border} ${cardBg} shadow-sm overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${dark ? "border-white/5" : "border-[#0B3D91]/6"} ${sectionHeaderBg} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg ${dark ? "bg-white/5" : "bg-[#EEF2F8]"} flex items-center justify-center`}><Network size={14} className="text-[#0B3D91]" /></div>
          <span className={`font-bold ${textPrimary} text-sm`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>How Anonymous Feedback Works</span>
        </div>
        <div className="p-5 space-y-0">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${step.color}`}>
                  {step.num}
                </div>
                {idx < steps.length - 1 && <div className={`w-0.5 flex-1 ${dark ? "bg-white/10" : "bg-[#EEF2F8]"} my-1`} />}
              </div>
              <div className={`pb-5 ${idx === steps.length - 1 ? "pb-0" : ""}`}>
                <p className={`font-semibold ${textPrimary} text-sm mb-0.5`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{step.title}</p>
                <p className="text-xs text-[#5A6E8E] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div className={`rounded-2xl border ${border} ${cardBg} shadow-sm overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${dark ? "border-white/5" : "border-[#0B3D91]/6"} ${sectionHeaderBg} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg ${dark ? "bg-white/5" : "bg-[#EEF2F8]"} flex items-center justify-center`}><Lock size={14} className="text-[#0B3D91]" /></div>
          <span className={`font-bold ${textPrimary} text-sm`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Data Security Measures</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {securityFeatures.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={`flex gap-3 p-4 rounded-xl border transition-colors ${
              dark ? "border-white/5 bg-white/3 hover:bg-white/5" : "border-[#0B3D91]/8 bg-[#F8FAFD] hover:bg-[#EEF2F8]"
            }`}>
              <div className="w-9 h-9 rounded-xl bg-[#0B3D91] flex items-center justify-center shrink-0">
                <Icon size={15} className="text-white" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${textPrimary}`}>{title}</p>
                <p className="text-[11px] text-[#5A6E8E] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Rights */}
      <div className={`rounded-2xl border ${dark ? "border-emerald-500/20" : "border-emerald-100"} ${cardBg} shadow-sm overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${dark ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-300" : "border-emerald-100 bg-emerald-50 text-emerald-900"} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg ${dark ? "bg-emerald-950/50" : "bg-emerald-100"} flex items-center justify-center`}><Award size={14} className="text-emerald-600" /></div>
          <span className="font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your Rights as a Student</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rights.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={`flex gap-3 p-4 rounded-xl border ${dark ? "border-emerald-900/30 bg-emerald-950/10" : "border-emerald-100 bg-emerald-50/40"}`}>
              <div className={`w-8 h-8 rounded-lg ${dark ? "bg-emerald-900/50" : "bg-emerald-100"} flex items-center justify-center shrink-0`}>
                <Icon size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${textPrimary}`}>{title}</p>
                <p className="text-[11px] text-[#5A6E8E] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact for Privacy */}
      <div className={`rounded-2xl p-5 border ${border} ${cardBg} shadow-sm`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#0B3D91] flex items-center justify-center shrink-0"><Mail size={15} className="text-white" /></div>
          <div>
            <p className={`font-bold ${textPrimary} text-sm`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Privacy Concerns & Contact</p>
            <p className="text-xs text-[#5A6E8E]">Reach out if you have any questions about your data or privacy</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {[
            { label: "Data Protection Officer", value: "dpo@institute.ac.in" },
            { label: "General Support", value: "support@institute.ac.in" },
            { label: "Academic Section", value: "academic@institute.ac.in" },
            { label: "Office Hours", value: "Mon–Fri, 9:00 AM – 5:00 PM" },
          ].map(({ label, value }) => (
            <div key={label} className={`p-3 rounded-xl border ${dark ? "bg-white/3 border-white/5" : "bg-[#F8FAFD] border-[#0B3D91]/6"}`}>
              <p className="text-[10px] text-[#5A6E8E] font-semibold uppercase tracking-wider">{label}</p>
              <p className={`text-sm ${textPrimary} font-medium mt-0.5`}>{value}</p>
            </div>
          ))}
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#0a348a] transition-all shadow-md shadow-[#0B3D91]/20 cursor-pointer">
          <Mail size={14} /> Contact Privacy Office
        </button>
      </div>

      <p className="text-[10px] text-[#5A6E8E] text-center pb-4">
        {systemName} &nbsp;·&nbsp; {instituteName} &nbsp;·&nbsp; Privacy Policy v2.0
      </p>
    </div>
  );
};

export default PrivacyPolicy;
