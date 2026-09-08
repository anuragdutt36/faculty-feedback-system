import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link, useLocation } from "react-router";
import {
  Eye,
  EyeOff,
  Shield,
  Lock,
  RefreshCw,
  ShieldCheck,
  Users,
  BookOpen,
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { useTenant } from "../../context/TenantContext.js";
import { getFormattedLogoUrl } from "../../services/api.js";
import { AuthPageLayout } from "../../components/common/AuthPageLayout.js";

type LoginMode = "student" | "faculty" | "hod" | "dean" | "admin";

interface StaffRoleItem {
  id: LoginMode;
  label: string;
  shortLabel: string;
  roleTitle: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  desc: string;
  badge: string;
}

const STAFF_ROLES: StaffRoleItem[] = [
  {
    id: "faculty",
    label: "Faculty",
    shortLabel: "Faculty",
    roleTitle: "Faculty",
    icon: BookOpen,
    desc: "Teaching staff",
    badge: "Faculty Portal",
  },
  {
    id: "hod",
    label: "HOD",
    shortLabel: "HOD",
    roleTitle: "Head of Department",
    icon: Users,
    desc: "Head of Dept",
    badge: "Department Scope",
  },
  {
    id: "dean",
    label: "Dean",
    shortLabel: "Dean",
    roleTitle: "Academic Dean",
    icon: Building2,
    desc: "Academic dean",
    badge: "Academic Scope",
  },
  {
    id: "admin",
    label: "Admin",
    shortLabel: "Admin",
    roleTitle: "Administrator",
    icon: Shield,
    desc: "Control console",
    badge: "Control Console",
  },
];

export const LoginPage: React.FC = () => {
  const { login, staffLogin, googleLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { systemName, instituteName, googleLoginEnabled, domainRestriction } = useSettings();
  const { institution: tenantInst, loading: tenantLoading, error: tenantError, isSuspended, portalSlug } = useTenant();

  const modeParam = searchParams.get("mode") as LoginMode | null;
  const isLegacyAdmin = searchParams.get("admin") === "true";

  // Default mode is always STUDENT unless explicitly requested via URL
  const initialMode: LoginMode = (modeParam && ["student", "faculty", "hod", "dean", "admin"].includes(modeParam))
    ? modeParam
    : (isLegacyAdmin ? "admin" : "student");

  const [currentMode, setCurrentMode] = useState<LoginMode>(initialMode);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync mode with query parameters
  useEffect(() => {
    if (modeParam && ["student", "faculty", "hod", "dean", "admin"].includes(modeParam)) {
      setCurrentMode(modeParam);
    } else if (!modeParam && !isLegacyAdmin) {
      setCurrentMode("student");
    }
  }, [modeParam, isLegacyAdmin]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}`);
    }
  }, [isAuthenticated, user, navigate]);

  const isStudentMode = currentMode === "student";
  const isStaffMode = ["faculty", "hod", "dean"].includes(currentMode);
  const isAdminMode = currentMode === "admin";

  const currentStaffRole = STAFF_ROLES.find((r) => r.id === currentMode);

  // Initialize Google One Tap / Button for student mode
  useEffect(() => {
    if (isStudentMode && googleLoginEnabled) {
      let interval: any;
      let attempts = 0;

      const initGoogle = () => {
        const win = window as any;
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
        const btnContainer = document.getElementById("google-signin-btn-hidden");

        if (win.google && win.google.accounts && clientId) {
          try {
            win.google.accounts.id.initialize({
              client_id: clientId,
              callback: (response: any) => {
                if (response.credential) {
                  handleGoogleCredential(response.credential);
                }
              },
              ux_mode: "popup",
            });
            if (btnContainer) {
              win.google.accounts.id.renderButton(btnContainer, { theme: "outline", size: "large" });
            }
            if (interval) clearInterval(interval);
          } catch (e) {
            console.error("Google SSO initialization error:", e);
          }
        }

        attempts++;
        if (attempts > 20 && interval) {
          clearInterval(interval);
        }
      };

      interval = setInterval(initGoogle, 250);
      initGoogle();

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isStudentMode, googleLoginEnabled]);

  const instName = tenantInst?.name || instituteName || "Institution Portal";
  const allowedDomain = tenantInst?.settings?.domainRestriction || domainRestriction || (portalSlug ? `${portalSlug}.ac.in` : "");
  const logoUrl = getFormattedLogoUrl(tenantInst?.logoUrl || tenantInst?.settings?.logoUrl || "");

  const handleSwitchMode = (mode: LoginMode) => {
    setCurrentMode(mode);
    setErrorMsg("");
    setEmail("");
    setPassword("");
    if (mode === "student") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ mode }, { replace: true });
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setLoadingState(true);
    setErrorMsg("");
    try {
      await googleLogin(idToken);
    } catch (err: any) {
      setErrorMsg(err.message || "Google Sign-In failed. Please use your official student Google account.");
      setLoadingState(false);
    }
  };

  const handleGoogleButtonClick = () => {
    const googleLoginWrapper = document.querySelector("#google-signin-btn-hidden div[role=button]") as HTMLElement;
    if (googleLoginWrapper) {
      googleLoginWrapper.click();
    } else {
      const win = window as any;
      if (win.google?.accounts?.id) {
        try {
          win.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.warn("Google prompt not displayed.");
            }
          });
        } catch {
          console.error("Google prompt error.");
        }
      }
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both your official email address and password.");
      return;
    }
    setLoadingState(true);
    setErrorMsg("");
    try {
      await staffLogin(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password. Please verify your credentials.");
      setLoadingState(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter your administrator username and password.");
      return;
    }
    setLoadingState(true);
    setErrorMsg("");
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid administrator credentials. Please check your username and password.");
      setLoadingState(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800 font-sans">
        <div className="w-9 h-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading portal...</p>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center text-slate-900 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold mb-2">Portal Suspended</h1>
        <p className="text-xs text-slate-600 max-w-sm mb-5 leading-relaxed">
          Access to this portal is currently paused by platform administration.
        </p>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-[#0B3D91] hover:bg-[#093276] text-white text-xs font-semibold no-underline shadow-xs"
        >
          Back to Platform Home
        </Link>
      </div>
    );
  }

  if (!tenantInst) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center text-slate-900 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-4 shadow-xs">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold mb-2">Institution Not Found</h1>
        <p className="text-xs text-slate-600 max-w-sm mb-5 leading-relaxed">
          {tenantError || `The institution portal '/${portalSlug}' does not exist.`}
        </p>
        <Link
          to="/institution-login"
          className="px-4 py-2 rounded-xl bg-[#0B3D91] hover:bg-[#093276] text-white text-xs font-semibold no-underline shadow-xs"
        >
          Find Your Institution
        </Link>
      </div>
    );
  }

  return (
    <AuthPageLayout
      icon={
        logoUrl ? (
          <img src={logoUrl} alt={instName} className="h-7 w-7 object-contain" />
        ) : (
          <Building2 className="w-6 h-6 text-[#0B3D91]" />
        )
      }
      title={isStudentMode ? instName : (currentStaffRole?.roleTitle || "Staff Sign In")}
      subtitle={
        isStudentMode ? (
          <span className="inline-flex items-center gap-1.5 flex-wrap justify-center">
            <span>Student & Academic Portal</span>
            <span className="text-slate-300">•</span>
            <Link
              to="/institution-login"
              className="text-[#0B3D91] hover:underline font-semibold"
            >
              Change college
            </Link>
          </span>
        ) : (
          "Sign in with your assigned institutional email & password"
        )
      }
      errorMessage={errorMsg}
      backLink={
        !isStudentMode
          ? {
              label: "Back to Student Login",
              onClick: () => handleSwitchMode("student"),
            }
          : {
              label: portalSlug ? "Back to College Home" : "Back to Platform Home",
              to: portalSlug ? `/college/${portalSlug}` : "/",
            }
      }
    >
      {/* ============================================================
          VIEW 1: CLEAN PRIMARY STUDENT LOGIN
      ============================================================ */}
      {isStudentMode && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Primary Student Google SSO */}
          {googleLoginEnabled ? (
            <div className="space-y-2.5">
              <button
                type="button"
                id="student-google-signin-btn"
                onClick={handleGoogleButtonClick}
                disabled={loadingState}
                className="w-full py-3 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loadingState ? "Signing in..." : "Continue with Google (Student SSO)"}</span>
              </button>

              {/* Subtle Privacy & Domain Indicator */}
              <div className="flex items-center justify-between px-2 mt-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold tracking-wide">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  100% Anonymous Feedback
                </span>
                {allowedDomain && (
                  <span className="text-slate-400 font-mono tracking-wide">
                    @{allowedDomain}
                  </span>
                )}
              </div>

              <div id="google-signin-btn-hidden" className="hidden"></div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-sm text-amber-800 font-medium">Google Sign-In is temporarily unavailable.</p>
            </div>
          )}

          {/* Secondary Switcher Option for Faculty, HOD, Dean & Admin */}
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Are you a faculty, HOD, dean or admin?
            </p>
            <button
              type="button"
              onClick={() => handleSwitchMode("faculty")}
              className="text-[#0B3D91] hover:text-[#093276] hover:underline font-bold text-sm inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 transition-colors"
            >
              <span>Staff & Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 2: STAFF & ADMIN CREDENTIAL LOGIN
      ============================================================ */}
      {!isStudentMode && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Quick Staff Role Segmented Tabs */}
          <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1">
            {STAFF_ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = role.id === currentMode;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSwitchMode(role.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-[#0B3D91] shadow-2xs font-bold border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                  title={role.label}
                >
                  <Icon className={`w-3.5 h-3.5 mb-0.5 shrink-0 ${isSelected ? "text-[#0B3D91]" : "text-slate-500"}`} />
                  <span className="text-xs leading-none truncate max-w-full">
                    {role.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form for Faculty, HOD, and Dean */}
          {isStaffMode && (
            <form onSubmit={handleStaffLogin} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder={allowedDomain ? `name@${allowedDomain}` : "name@college.ac.in"}
                    autoComplete="email"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-sm text-[#0B3D91] hover:underline font-medium cursor-pointer border-0 bg-transparent"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingState || !email || !password}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border-0 active:scale-[0.99]"
              >
                {loadingState ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as {currentStaffRole?.shortLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form for Administrator */}
          {isAdminMode && (
            <form onSubmit={handleAdminLogin} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Administrator Username / Email
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder="admin@college.ac.in"
                    autoComplete="username"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-sm text-[#0B3D91] hover:underline font-medium cursor-pointer border-0 bg-transparent"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingState || !email || !password}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border-0 active:scale-[0.99]"
              >
                {loadingState ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Continue to Admin Console</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </AuthPageLayout>
  );
};

export default LoginPage;
