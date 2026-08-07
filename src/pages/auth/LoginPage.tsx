import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff, Shield, Lock, CheckCircle2, RefreshCw, ChevronLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { LogoMark } from "../../components/common/LogoMark.js";
import { PrivacyBanner } from "../../components/common/PrivacyBanner.js";

type Role = "student" | "admin";

export const LoginPage: React.FC = () => {
  const { login, googleLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read role from query param, default to student
  const queryRole = searchParams.get("role");
  const initialRole: Role = queryRole === "admin" ? "admin" : "student";

  const [role, setRole] = useState<Role>(initialRole);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Local testing mock Google email
  const [mockGoogleEmail, setMockGoogleEmail] = useState("");
  const [showSandbox, setShowSandbox] = useState(false);

  const { systemName, instituteName, logoUrl, googleLoginEnabled, anonymousFeedback } = useSettings();

  const handleGoogleCredential = async (idToken: string) => {
    setLoadingState(true);
    setErrorMsg("");
    try {
      await googleLogin(idToken);
    } catch (err: any) {
      setErrorMsg(err.message || "Google Sign-In failed. Only official institution emails registered in records are allowed.");
      setLoadingState(false);
    }
  };

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated && user) {
      navigate(`/${user.role}`);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (role === "student" && googleLoginEnabled) {
      const initGoogle = () => {
        const win = window as any;
        if (win.google && win.google.accounts) {
          win.google.accounts.id.initialize({
            client_id: "695413120178-m1g87ivdavmsm5m8tjs7391ga30evhf1.apps.googleusercontent.com",
            callback: (response: any) => {
              if (response.credential) {
                handleGoogleCredential(response.credential);
              }
            }
          });
          win.google.accounts.id.renderButton(
            document.getElementById("google-signin-btn"),
            { theme: "outline", size: "large", width: 340 }
          );
        }
      };

      const timer = setTimeout(initGoogle, 500);
      return () => clearTimeout(timer);
    }
  }, [role, googleLoginEnabled]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState(true);
    setErrorMsg("");

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate. Please check your credentials.");
      setLoadingState(false);
    }
  };

  const handleMockGoogleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState(true);
    setErrorMsg("");
    setShowSandbox(false);

    try {
      // Use dev token bypass
      await googleLogin("dev_mock_token_" + mockGoogleEmail);
    } catch (err: any) {
      setErrorMsg(err.message || "Google Sign-In failed. Only official institution emails registered in records are allowed.");
      setLoadingState(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left pane - branding */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden" style={{ background: "linear-gradient(145deg, #041030 0%, #0B3D91 60%, #1e6dd8 100%)" }}>
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <defs>
            <pattern id="lgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lgrid)" />
        </svg>
        <div className="relative z-10 flex flex-col h-full p-12">
            <div className="flex items-center gap-3">
              <LogoMark size={48} dark />
              <div>
                <div className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {systemName} Faculty Feedback System
                </div>
                <div className="text-blue-100 text-xs mt-0.5 opacity-80">{instituteName}</div>
              </div>
            </div>
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-72 h-72 relative mb-8">
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)" }} />
              <svg viewBox="0 0 280 280" className="w-full h-full">
                <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <circle cx="140" cy="140" r="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <circle cx="140" cy="140" r="60" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
                <rect x="110" y="132" width="60" height="28" rx="4" fill="rgba(255,255,255,0.15)" />
                <polygon points="140,108 100,128 140,148 180,128" fill="rgba(255,255,255,0.2)" />
                <line x1="180" y1="128" x2="180" y2="155" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <circle cx="180" cy="158" r="4" fill="rgba(255,255,255,0.4)" />
                {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                  const r = (deg * Math.PI) / 180;
                  const x = 140 + 100 * Math.cos(r); const y = 140 + 100 * Math.sin(r);
                  return <g key={i}><circle cx={x} cy={y} r="6" fill={i % 2 === 0 ? "rgba(59,130,246,0.6)" : "rgba(167,139,250,0.6)"} /><line x1="140" y1="140" x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" /></g>;
                })}
                <path d="M140 195 L125 205 L125 220 Q125 232 140 238 Q155 232 155 220 L155 205 Z" fill="rgba(16,185,129,0.25)" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
                <path d="M132 218 L138 224 L149 213" stroke="rgba(16,185,129,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {role === "student" ? "Share Your Honest Feedback" : "Admin Control Panel"}
            </h2>
            <p className="text-blue-200 text-sm text-center max-w-xs leading-relaxed mb-6">
              {role === "student" 
                ? (anonymousFeedback ? "Your identity is completely protected. Faculty members and administrators cannot trace any feedback back to you." : "Share your honest feedback securely. Your submissions help improve academic quality at our institute.") 
                : "Secure university control panel. Role-based audits, logs, settings, and analytics reports are protected."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { icon: Shield, label: anonymousFeedback ? "Anonymous Feedback" : "Monitored Feedback", color: anonymousFeedback ? "text-violet-300" : "text-blue-300" }, 
                { icon: Lock, label: "Secure Session", color: "text-emerald-300" }, 
                { icon: CheckCircle2, label: "One-Time Submission", color: "text-amber-300" }
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-blue-100 text-xs border border-white/15">
                  <Icon size={11} className={color} /> {label}
                </div>
              ))}
            </div>
          </div>
          <div className="text-blue-300 text-xs text-center">Uttar Pradesh, India &nbsp;·&nbsp; Established 1963 &nbsp;·&nbsp; NAAC Accredited</div>
        </div>
      </div>

      {/* Right pane - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#EEF2F8] min-h-screen lg:min-h-0">
        <div className="w-full max-w-md relative">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6 sm:mb-8 text-center">
            <LogoMark size={36} dark={false} />
            <div>
              <div className="text-[#0D1B3E] font-bold text-xs sm:text-sm leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{systemName} Faculty Feedback System</div>
              <div className="text-[#5A6E8E] text-[11px]">{instituteName}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl shadow-xl shadow-[#0B3D91]/8 border border-[#0B3D91]/8 p-5 sm:p-8">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0D1B3E] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Welcome back</h1>
              <p className="text-[#5A6E8E] text-xs sm:text-sm">Sign in to your account to continue</p>
            </div>
            
            {/* Role selector tabs */}
            <div className="grid grid-cols-2 rounded-xl bg-[#EEF2F8] p-1 mb-6 text-center text-xs">
              {(["student", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setErrorMsg("");
                  }}
                  className={`py-2.5 rounded-lg font-semibold transition-all capitalize cursor-pointer border-0 ${
                    role === r ? "bg-white text-[#0B3D91] shadow-sm font-bold" : "text-[#5A6E8E] hover:text-[#0D1B3E] bg-transparent"
                  }`}
                >
                  {r === "student" ? "🎓 Student" : "🛡 Admin"}
                </button>
              ))}
            </div>

            {role === "student" && <div className="mb-5"><PrivacyBanner compact /></div>}
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <span>⚠️ {errorMsg}</span>
              </div>
            )}

            {role === "student" ? (
              <div className="space-y-4 flex flex-col items-center">
                {googleLoginEnabled ? (
                  <>
                    <p className="text-xs text-[#5A6E8E] leading-relaxed text-center w-full">
                      Students authenticate securely using their institutional Google Workspace account. No password is required.
                    </p>
                    
                    {/* Official Google Sign-in button target container */}
                    <div id="google-signin-btn" className="w-full flex justify-center py-2 min-h-[40px]"></div>
                  </>
                ) : (
                  <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-center w-full">
                    <p className="text-xs text-amber-800 font-semibold mb-1">Google Sign-In Disabled</p>
                    <p className="text-[11px] text-amber-600 leading-normal">Google sign-in is currently disabled by the administrator. Please try again later or contact the portal administrator.</p>
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSandbox(true)}
                    className="text-[11px] text-[#3B82F6] hover:underline font-semibold cursor-pointer border-0 bg-transparent"
                  >
                    Having trouble? Open Local Testing Sandbox
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0D1B3E]/70 mb-1.5">
                    Admin Email / ID
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@institute.ac.in"
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F4FA] border border-[#0B3D91]/10 text-[#0D1B3E] text-sm placeholder:text-[#5A6E8E]/60 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-[#0D1B3E]/70 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-[#F0F4FA] border border-[#0B3D91]/10 text-[#0D1B3E] text-sm placeholder:text-[#5A6E8E]/60 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6E8E] hover:text-[#0B3D91] transition-colors p-1 cursor-pointer border-0 bg-transparent"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer" onClick={() => setRemember(!remember)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      remember ? "bg-[#0B3D91] border-[#0B3D91]" : "border-[#5A6E8E]/40"
                    }`}>
                      {remember && <span className="text-[10px] text-white">✓</span>}
                    </div>
                    <span className="text-xs text-[#5A6E8E] select-none">Remember me</span>
                  </label>
                </div>
                {!googleLoginEnabled && (
                  <div className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded-lg">
                    Google Sign-In is currently disabled by administrators.
                  </div>
                )} 
                <button
                  type="submit"
                  disabled={loadingState}
                  className="w-full py-3.5 rounded-xl bg-[#0B3D91] text-white font-semibold text-sm hover:bg-[#0a348a] active:scale-[0.98] transition-all shadow-lg shadow-[#0B3D91]/25 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loadingState ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      Sign In Securely
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-5 flex items-center justify-center gap-2 text-[#5A6E8E] text-xs">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>256-bit encrypted &nbsp;·&nbsp; {systemName} Secure Portal</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate("/")}
            className="mt-5 flex items-center gap-1.5 text-[#5A6E8E] hover:text-[#0B3D91] text-sm transition-colors mx-auto bg-transparent border-0 cursor-pointer"
          >
            <ChevronLeft size={14} /> Back to Home
          </button>

          {/* Sandbox Local Testing Modal popup overlay */}
          {showSandbox && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl relative">
                <h3 className="text-lg font-bold text-[#0D1B3E] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Google Sign-In Sandbox</h3>
                <p className="text-xs text-[#5A6E8E] mb-4 leading-relaxed">
                  To test the Google Sign-in flow locally, type your student email. The system verifies domain restrictions and record eligibility.
                </p>
                <form onSubmit={handleMockGoogleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0D1B3E]/70 mb-1">Student Email Address</label>
                    <input
                      type="text"
                      required
                      value={mockGoogleEmail}
                      onChange={(e) => setMockGoogleEmail(e.target.value)}
                      placeholder="e.g. 2025mca001@institute.ac.in"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F0F4FA] border border-[#0B3D91]/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 text-[#0D1B3E]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSandbox(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-semibold hover:bg-[#0a348a] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Verify &amp; Sign In <ArrowRight size={12} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
