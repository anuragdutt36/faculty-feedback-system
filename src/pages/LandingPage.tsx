import React from "react";
import { useNavigate } from "react-router";
import {
  Shield, Lock, UserCheck, Settings, ArrowRight, CheckCircle2, Award, Globe, LogIn
} from "lucide-react";
import { LogoMark } from "../components/common/LogoMark.js";
import { useSettings } from "../context/SettingsContext.js";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { systemName, instituteName } = useSettings();

  const features = [
    { icon: Shield, title: "100% Anonymous", desc: "Student identity is cryptographically decoupled from feedback data. No one can trace a response back to a student." },
    { icon: Award, title: "Rich Analytics", desc: "Semester-wise trends, department comparisons, faculty rating distributions, and exportable reports." },
    { icon: Lock, title: "Secure & Audited", desc: "Role-based access control, complete audit logs, encrypted storage, and one-time submission enforcement." },
    { icon: CheckCircle2, title: "One-Click Sessions", desc: "Admins create feedback sessions in seconds. Reports generate automatically when sessions close." },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden" style={{ background: "linear-gradient(135deg, #041030 0%, #0B3D91 50%, #1a5dc8 100%)" }}>
      <nav className="flex items-center justify-between px-3.5 sm:px-8 py-3 sm:py-4 border-b border-white/10 backdrop-blur-sm sticky top-0 z-40 gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <LogoMark size={36} dark className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
          <div className="min-w-0">
            <div className="text-white font-bold text-xs sm:text-base leading-snug line-clamp-2 sm:line-clamp-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {systemName} Faculty Feedback System
            </div>
            <div className="text-blue-200 text-[10px] sm:text-xs leading-tight truncate mt-0.5">{instituteName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => navigate("/login")}
            className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-white text-[#0B3D91] hover:bg-blue-50 transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer text-center whitespace-nowrap flex items-center gap-1.5"
          >
            <LogIn size={15} className="shrink-0" />
            <span>Login</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-20 text-center w-full max-w-full">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 border border-white/20 text-blue-100 text-[10px] sm:text-xs font-semibold mb-6 sm:mb-8 backdrop-blur-sm max-w-full text-center">
          <span className="inline-flex items-center gap-1"><Shield size={12} className="text-violet-300 shrink-0" /> Anonymous Feedback System</span>
          <span className="hidden sm:inline text-white/40">·</span>
          <span className="inline-flex items-center gap-1"><Lock size={12} className="text-emerald-300 shrink-0" /> Privacy Protected</span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl mb-4 sm:mb-6 leading-tight break-words px-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Faculty Feedback,<br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}>Reimagined for {systemName}</span>
        </h1>
        <p className="text-blue-200 text-xs sm:text-base md:text-lg max-w-2xl mb-6 sm:mb-10 leading-relaxed px-3">
          A modern, secure platform for students to provide honest and completely anonymous feedback on faculty performance — helping {systemName} build a culture of continuous academic excellence.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 mb-8 sm:mb-14 w-full sm:w-auto px-4 max-w-md sm:max-w-none">
          <button onClick={() => navigate("/login?role=student")} className="flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-base font-semibold bg-white text-[#0B3D91] hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5 cursor-pointer">
            <UserCheck size={18} /> Submit Feedback as Student <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate("/login?role=admin")} className="flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-base font-semibold border border-white/30 text-white hover:bg-white/10 transition-all cursor-pointer">
            <Settings size={18} /> Admin Portal
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-10 sm:mb-16 text-blue-200 text-xs sm:text-sm px-2">
          {[{ icon: Shield, label: "Zero Identity Exposure" }, { icon: Lock, label: "Secure & Encrypted" }, { icon: CheckCircle2, label: "One-Time Submission" }, { icon: Award, label: "NAAC Aligned" }].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 sm:gap-2"><Icon size={14} className="text-emerald-300 shrink-0" /><span>{label}</span></div>
          ))}
        </div>
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-20">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-4 sm:p-6 bg-white/8 border border-white/12 backdrop-blur-sm hover:bg-white/12 transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-[#0B3D91] border border-white/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Icon size={18} className="text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5 sm:mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
              <p className="text-blue-200/80 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="w-full max-w-3xl mx-auto rounded-2xl bg-white/6 border border-white/12 backdrop-blur-sm px-4 sm:px-8 py-4 sm:py-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center">
          {[{ value: "3,200+", label: "Students Enrolled" }, { value: "180+", label: "Faculty Members" }, { value: "7", label: "Departments" }, { value: "98%", label: "Anonymity Guarantee" }].map(({ value, label }) => (
            <div key={label}><div className="text-lg sm:text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div><div className="text-blue-200 text-[10px] sm:text-xs mt-1">{label}</div></div>
          ))}
        </div>
      </div>
      <footer className="border-t border-white/10 px-4 sm:px-8 py-6 w-full">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-blue-200 text-xs text-center md:text-left">
          <div className="flex items-center gap-3">
            <LogoMark size={28} dark />
            <div>
              <div className="text-white font-semibold">{systemName} Faculty Feedback System</div>
              <div className="text-blue-200/70">{instituteName}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="flex items-center gap-1"><Globe size={12} /> {(systemName || "KNIT").toLowerCase()}.ac.in</span>
            <span className="flex items-center gap-1"><Shield size={12} /> Privacy Policy</span>
            <span className="text-blue-300">v2.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

