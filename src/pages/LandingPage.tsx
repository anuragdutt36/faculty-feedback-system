import React from "react";
import { useNavigate } from "react-router";
import {
  Shield, Lock, UserCheck, Settings, ArrowRight, CheckCircle2, Award, LogIn,
  BarChart3, FileText, HelpCircle, Mail, Activity, Sparkles, Layers, ShieldCheck,
  ChevronRight, Cpu, ArrowUpRight, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { LogoMark } from "../components/common/LogoMark.js";
import { Footer } from "../components/layout/Footer.js";
import { AnimatedCounter } from "../components/common/AnimatedCounter.js";
import { useSettings } from "../context/SettingsContext.js";
import { settingsService } from "../services/settings.service.js";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { systemName, instituteName } = useSettings();
  const [stats, setStats] = React.useState({ students: 3200, faculty: 180, departments: 7 });

  const sysName = systemName || "KNIT";
  const instName = instituteName || "Kamla Nehru Institute of Technology, Sultanpur";

  React.useEffect(() => {
    settingsService.getPublicStats()
      .then(res => {
        if (res?.success && res.data) {
          setStats({
            students: res.data.students || 0,
            faculty: res.data.faculty || 0,
            departments: res.data.departments || 0,
          });
        }
      })
      .catch(err => console.error("Failed to load stats", err));
  }, []);

  const whyFeatures = [
    {
      icon: Shield,
      title: "100% Anonymous",
      desc: "Student identity is cryptographically separated from feedback data. Responses cannot be traced back to an individual under any circumstance.",
      color: "from-violet-500 to-indigo-600",
    },
    {
      icon: Lock,
      title: "Secure & Encrypted",
      desc: "Role-based authentication, encrypted storage, and protected sessions guarantee tamper-resistant record keeping and privacy.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: BarChart3,
      title: "Rich Analytics",
      desc: "Department-wise, semester-wise, and faculty-wise evaluation reports and trend metrics designed for academic leadership.",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: Award,
      title: "NAAC & Quality Ready",
      desc: "Designed to support institutional quality assurance, statutory accreditation parameters, and continuous academic enhancement.",
      color: "from-amber-500 to-orange-600",
    },
  ];

  const privacyPoints = [
    {
      title: "Eligibility Verification Only",
      desc: "Login is used only to verify student enrollment eligibility and prevent duplicate submissions. Credentials are never written to feedback records.",
      icon: CheckCircle2,
    },
    {
      title: "Faculty Cannot Identify Students",
      desc: "Course instructors and faculty members only receive averaged scores and qualitative themes. They cannot view individual student identities or timestamps.",
      icon: ShieldCheck,
    },
    {
      title: "Aggregated Analytics Only",
      desc: "Reports and trend distributions are generated strictly from aggregated datasets, ensuring full collective privacy across every section.",
      icon: BarChart3,
    },
    {
      title: "Automated Record Decoupling",
      desc: "Feedback submissions are detached from personal identities and cryptographically anonymized before database ingestion and analytics processing.",
      icon: Cpu,
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Official Email Login",
      desc: `Students log in securely using their official ${sysName} Google Workspace institutional account.`,
      icon: LogIn,
    },
    {
      step: "02",
      title: "Auto-Verification",
      desc: "Academic profile, registered semester, and enrolled subject faculties are verified automatically in real time.",
      icon: UserCheck,
    },
    {
      step: "03",
      title: "Anonymous Submission",
      desc: "Submit objective rating questions and constructive feedback for assigned teachers with guaranteed confidentiality.",
      icon: Shield,
    },
    {
      step: "04",
      title: "Aggregated Reports",
      desc: "Academic leadership and HODs receive comprehensive aggregated reports to drive teaching excellence.",
      icon: BarChart3,
    },
  ];

  const supportCards = [
    {
      title: "Help & FAQ",
      desc: "Find quick answers regarding login access, subject mappings, and portal evaluation guidelines.",
      icon: HelpCircle,
      action: () => navigate("/login?role=student"),
      badge: "Knowledgebase",
    },
    {
      title: "Privacy Policy",
      desc: "Read our comprehensive documentation on cryptographic student privacy and data handling standards.",
      icon: FileText,
      action: () => navigate("/login?role=student"),
      badge: "Institutional Policy",
    },
    {
      title: "Contact & Support",
      desc: `Direct inquiries to the ${sysName} Academic Support Team and feedback portal administrators.`,
      icon: Mail,
      link: "mailto:feedback-support@knit.ac.in",
      badge: "feedback-support@knit.ac.in",
    },
    {
      title: "System Status",
      desc: "All core feedback microservices, encryption pipelines, and report generation systems are operational.",
      icon: Activity,
      badge: "All Systems Operational",
      badgeColor: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden text-white relative" style={{ background: "linear-gradient(135deg, #041030 0%, #0B3D91 50%, #1a5dc8 100%)", backgroundAttachment: "fixed" }}>
      {/* Background Ambient Animation Elements */}
      <motion.div 
        animate={{ y: ["0%", "-1%"] }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="fixed inset-0 overflow-hidden pointer-events-none -z-20"
      >
        {/* Soft radial blue glow behind heading drifting horizontally */}
        <motion.div 
          animate={{ x: ["-2%", "2%"] }}
          transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          className="absolute top-[10%] left-[30%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[140px]" 
        />
        {/* Subtle secondary glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[160px]" />
        
        {/* Animated light sweep from top center every 8-10s */}
        <motion.div 
          animate={{ opacity: [0, 0.1, 0], y: ["-20%", "40%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
          className="absolute top-0 left-[35%] w-[30%] h-[80%] bg-gradient-to-b from-transparent via-white/20 to-transparent blur-[80px]" 
        />
      </motion.div>

      {/* Top Navigation Bar */}
      <motion.nav 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} 
        className="backdrop-blur-sm sticky top-0 z-40"
      >
        <div className="max-w-[1536px] w-full mx-auto flex items-center justify-between px-4 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 gap-3 sm:gap-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1"
          >
            <LogoMark size={40} dark className="w-8 h-8 sm:w-11 sm:h-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-white font-bold text-xs sm:text-lg lg:text-xl leading-snug line-clamp-2 sm:line-clamp-none tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {sysName} Faculty Feedback System
              </div>
              <div className="text-blue-200 text-[10px] sm:text-sm leading-tight truncate mt-0.5 max-w-[180px] sm:max-w-none font-medium">{instName}</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="flex items-center gap-2 sm:gap-4 shrink-0"
          >
            <button
              onClick={() => navigate("/login")}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-white text-[#0B3D91] hover:bg-blue-50 transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer text-center whitespace-nowrap flex items-center gap-1.5"
            >
              <LogIn size={15} className="shrink-0 sm:w-[16px] sm:h-[16px]" />
              <span>Login</span>
            </button>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24 lg:pb-32 text-center w-full max-w-full relative z-10">
        <div className="w-full max-w-[340px] sm:max-w-[1200px] mx-auto flex flex-col items-center justify-center pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-20 lg:pb-24">
          
          <motion.div 
            initial={{ opacity: 0, y: 15, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="inline-flex flex-wrap items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/15 text-blue-100 text-[9px] sm:text-xs font-semibold mb-6 sm:mb-10 lg:mb-12 backdrop-blur-sm max-w-full text-center tracking-wide uppercase"
          >
            <span className="inline-flex items-center gap-1.5"><Shield size={10} className="text-violet-300 shrink-0 sm:w-[12px] sm:h-[12px]" /> Anonymous Feedback System</span>
            <span className="hidden sm:inline text-white/40 px-1">·</span>
            <span className="inline-flex items-center gap-1.5 ml-1 sm:ml-0"><Lock size={10} className="text-emerald-300 shrink-0 sm:w-[12px] sm:h-[12px]" /> Privacy Protected</span>
          </motion.div>
          
          <h1 className="flex flex-col items-center justify-center font-extrabold text-white w-full max-w-[300px] sm:max-w-5xl mb-6 sm:mb-10 lg:mb-12 break-words px-2 mx-auto tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="text-[32px] sm:text-5xl md:text-7xl lg:text-[88px] xl:text-[100px] leading-[1.15] lg:leading-[1.1] mb-2 sm:mb-3 block overflow-hidden">
              <motion.span 
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                className="block"
              >
                Faculty Feedback,
              </motion.span>
            </span>
            <span className="text-[26px] sm:text-5xl md:text-7xl lg:text-[88px] xl:text-[100px] leading-[1.25] lg:leading-[1.1] block overflow-hidden">
              <motion.span 
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
                className="block text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa)" }}
              >
                <motion.span 
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} 
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% auto" }}
                  className="block text-transparent bg-clip-text w-full"
                >
                  Reimagined for {sysName}
                </motion.span>
              </motion.span>
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.3 }}
            className="text-blue-100/80 text-[13px] sm:text-base lg:text-xl w-full max-w-[320px] sm:max-w-[700px] mb-8 sm:mb-12 lg:mb-16 leading-relaxed sm:leading-[1.8] text-center mx-auto px-1 font-normal"
          >
            A modern, secure platform for students to provide honest and completely anonymous feedback on faculty performance — helping {sysName} build a culture of continuous academic excellence.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 w-full max-w-[280px] sm:max-w-none mx-auto">
            <motion.button 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.7 }}
              onClick={() => navigate("/login?role=student")} 
              className="relative overflow-hidden flex items-center justify-center gap-1.5 sm:gap-2.5 w-full sm:w-auto px-5 sm:px-8 lg:px-10 py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-bold bg-white text-[#0B3D91] hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5 hover:shadow-blue-500/30 cursor-pointer group"
            >
              <motion.div 
                animate={{ opacity: [0, 0.5, 0], scale: [1, 1.05, 1] }} 
                transition={{ duration: 2, delay: 2.2, ease: "easeInOut", times: [0, 0.5, 1] }}
                className="absolute inset-0 bg-blue-100/30 rounded-2xl pointer-events-none" 
              />
              <UserCheck size={16} className="sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]" /> 
              <span>Submit Feedback as Student</span> 
              <ArrowRight size={14} className="sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px]" />
            </motion.button>
            <motion.button 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.85 }}
              onClick={() => navigate("/login?role=admin")} 
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-8 lg:px-10 py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-bold border-2 border-white/20 text-white hover:bg-white/10 hover:shadow-xl hover:-translate-y-0.5 hover:shadow-white/10 transition-all cursor-pointer"
            >
              <Settings size={16} className="sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]" /> Admin Portal
            </motion.button>
          </div>
        </div>

        {/* Feature Highlights (Moved below Hero container) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap items-start sm:items-center justify-center gap-x-6 gap-y-6 sm:gap-8 lg:gap-16 text-blue-200/80 text-[10px] sm:text-xs lg:text-sm px-2 w-full max-w-[320px] sm:max-w-none mx-auto mb-16 sm:mb-24 lg:mb-32 mt-4 sm:mt-8">
          {[{ icon: Shield, label: "Zero Identity Exposure" }, { icon: Lock, label: "Secure & Encrypted" }, { icon: CheckCircle2, label: "One-Time Submission" }, { icon: Award, label: "NAAC Aligned" }].map(({ icon: Icon, label }, index) => (
            <motion.div 
              key={label} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 2.1 + (index * 0.12) }}
              className="flex flex-col sm:flex-row items-center justify-center text-center gap-1.5 sm:gap-2.5 w-[110px] sm:w-auto mx-auto font-medium"
            >
              <Icon size={15} className="text-emerald-300 shrink-0 mb-0.5 sm:mb-0 sm:w-[17px] sm:h-[17px] lg:w-[20px] lg:h-[20px]" />
              <span className="leading-tight">{label}</span>
            </motion.div>
          ))}
        </div>

        {/* Dynamic Real-Time Stats Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-10%" }}
          className="relative overflow-hidden w-full max-w-[340px] sm:max-w-3xl lg:max-w-5xl mx-auto rounded-2xl lg:rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm px-4 sm:px-8 lg:px-12 py-5 sm:py-7 lg:py-9 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center shadow-xl mb-16 sm:mb-24 lg:mb-32 animate-glass-sweep"
        >
          {[{ value: stats.students > 0 ? stats.students : "—", label: "Students Enrolled" }, { value: stats.faculty > 0 ? stats.faculty : "—", label: "Faculty Members" }, { value: stats.departments > 0 ? stats.departments : "—", label: "Departments" }, { value: "98", label: "Anonymity Guarantee", suffix: "%" }].map(({ value, label, suffix }) => (
            <div key={label} className="flex flex-col items-center justify-center">
              <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-0.5 lg:mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <AnimatedCounter to={value} suffix={suffix} />
              </div>
              <div className="text-blue-200/70 text-[9px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* 1. WHY THIS SYSTEM SECTION */}
        <div className="w-full max-w-[1200px] mx-auto mb-16 sm:mb-24 lg:mb-32 px-4 sm:px-6 lg:px-8 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-10%" }}
            className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 lg:mb-16"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={12} className="text-blue-300" />
              <span>Why This System?</span>
            </div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Engineered for Institutional Quality &amp; Transparency
            </h2>
            <p className="text-blue-200/70 text-xs sm:text-sm leading-relaxed font-normal">
              A comprehensive institutional feedback infrastructure built to elevate teaching standards while guaranteeing strict privacy protections.
            </p>
          </motion.div>

          {/* Single-column on mobile, 2-col tablet, 4-col desktop with generous internal and external spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {whyFeatures.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] lg:hover:-translate-y-1.5 lg:hover:shadow-2xl lg:hover:shadow-blue-500/10 lg:hover:border-white/10 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${color} border border-white/10 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg lg:text-xl mb-3 leading-snug tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {title}
                  </h3>
                  <p className="text-blue-100/70 text-[13px] sm:text-sm leading-[1.7] font-normal">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. PRIVACY & ANONYMITY SECTION */}
        <div className="w-full max-w-[1200px] mx-auto mb-16 sm:mb-24 lg:mb-32 px-4 sm:px-6 lg:px-8 text-left">
          <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-xl relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading & Summary */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true, margin: "-10%" }}
                className="lg:col-span-5 space-y-3.5 text-center lg:text-left"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck size={13} className="text-violet-300" />
                  <span>Privacy &amp; Anonymity</span>
                </div>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Zero Identity Exposure by Design
                </h2>
                <p className="text-blue-200/75 text-xs sm:text-sm leading-relaxed">
                  Student confidentiality is not merely a policy — it is built directly into our database architecture and token verification pipeline.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-2.5">
                  <button
                    onClick={() => navigate("/login?role=student")}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-[#0B3D91] hover:bg-blue-50 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Login &amp; Evaluate</span>
                    <ArrowRight size={13} />
                  </button>
                  <a
                    href="mailto:feedback-support@knit.ac.in"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/15 text-white hover:bg-white/5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-center"
                  >
                    <Mail size={13} />
                    <span>Inquire with DPO</span>
                  </a>
                </div>
              </motion.div>

              {/* Right Column: 4 Privacy Pillars */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {privacyPoints.map(({ title, desc, icon: Icon }) => (
                  <div key={title} className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/8 flex flex-col justify-between hover:bg-white/[0.04] transition-colors relative hover:-translate-y-0.5 duration-300">
                    <div className="flex items-start gap-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-400/25 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-violet-300" />
                      </div>
                      <h4 className="text-white font-bold text-xs sm:text-sm leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {title}
                      </h4>
                    </div>
                    <p className="text-blue-200/70 text-[11px] sm:text-xs leading-relaxed font-normal pl-9">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. HOW IT WORKS SECTION */}
        <div className="w-full max-w-[1200px] mx-auto mb-16 sm:mb-24 lg:mb-32 px-4 sm:px-6 lg:px-8 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-10%" }}
            className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 lg:mb-16"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
              <Layers size={12} className="text-emerald-300" />
              <span>How It Works</span>
            </div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Simple, 4-Step Institutional Workflow
            </h2>
            <p className="text-blue-200/70 text-xs sm:text-sm leading-relaxed font-normal">
              A transparent, automated cycle from student submission to administrative review.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 relative">
            {/* Animated connection line for desktop */}
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
              viewport={{ once: true }}
              className="hidden lg:block absolute top-[20%] left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent transform origin-left z-0"
            />
            
            {workflowSteps.map(({ step, title, desc, icon: Icon }, idx) => (
              <div key={step} className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/[0.06] transition-all duration-300 shadow-lg group relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <span className="text-xl sm:text-2xl font-extrabold text-white/30 group-hover:text-blue-300 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon size={16} className="text-emerald-300" />
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1.5 leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {title}
                  </h3>
                  <p className="text-blue-200/70 text-xs sm:text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
                <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-blue-200/50 font-semibold uppercase tracking-wider">
                  <span>Step {idx + 1} of 4</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SUPPORT & RESOURCES SECTION */}
        <div className="w-full max-w-[1200px] mx-auto mb-12 sm:mb-20 lg:mb-24 px-4 sm:px-6 lg:px-8 text-left">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle size={12} className="text-amber-300" />
              <span>Support &amp; Helpdesk</span>
            </div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Need Assistance or Have Questions?
            </h2>
            <p className="text-blue-200/70 text-xs sm:text-sm leading-relaxed font-normal">
              Access institutional resources, accreditation guidelines, and feedback technical support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {supportCards.map(({ title, desc, icon: Icon, action, link, badge, badgeColor }) => {
              const CardContent = (
                <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/[0.06] hover:shadow-xl hover:shadow-white/5 transition-all duration-300 group h-full cursor-pointer relative hover:-translate-y-0.5">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Icon size={16} className="text-amber-300" />
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {title}
                      </h3>
                      {link ? <ArrowUpRight size={13} className="text-blue-300 opacity-60 group-hover:opacity-100 transition-opacity" /> : <ChevronRight size={13} className="text-blue-300 opacity-60 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    <p className="text-blue-200/70 text-[11px] sm:text-xs leading-relaxed mb-3.5">
                      {desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border ${badgeColor || "bg-white/5 border-white/10 text-blue-100/90"}`}>
                      {badge}
                    </span>
                  </div>
                </div>
              );

              if (link) {
                return (
                  <a key={title} href={link} className="block text-inherit no-underline h-full">
                    {CardContent}
                  </a>
                );
              }

              return (
                <div key={title} onClick={action} className="h-full">
                  {CardContent}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Global Landing Footer */}
      <Footer landing />
    </div>
  );
};

export default LandingPage;


