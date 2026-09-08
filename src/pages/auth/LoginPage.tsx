import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import {
  Eye,
  EyeOff,
  Shield,
  Lock,
  RefreshCw,
  ShieldCheck,
  GraduationCap,
  AlertCircle,
  ChevronLeft,
  Users,
  BookOpen,
  Building2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { useTenant } from "../../context/TenantContext.js";
import { PrivacyBanner } from "../../components/common/PrivacyBanner.js";
import { getFormattedLogoUrl } from "../../services/api.js";
import { AuthPageLayout } from "../../components/common/AuthPageLayout.js";

// Login modes map to distinct authentication flows
type LoginMode = "select" | "student" | "faculty" | "hod" | "dean" | "admin";

const ROLE_LABELS: Record<LoginMode, string> = {
  select: "Sign In",
  student: "Student Login",
  faculty: "Faculty Login",
  hod: "HOD Login",
  dean: "Dean Login",
  admin: "Administrator Login",
};

export const LoginPage: React.FC = () => {
  const { login, staffLogin, googleLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { systemName, instituteName, googleLoginEnabled, domainRestriction, logoUrl: globalLogoUrl } = useSettings();
  const { institution: tenantInst, loading: tenantLoading, error: tenantError, isSuspended, portalSlug } = useTenant();

  const modeParam = searchParams.get("mode") as LoginMode | null;
  const isLegacyAdmin = searchParams.get("admin") === "true";
  const currentMode: LoginMode = modeParam || (isLegacyAdmin ? "admin" : "select");

  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isStaffMode = ["faculty", "hod", "dean"].includes(currentMode);
  const isAdminMode = currentMode === "admin";
  const isStudentMode = currentMode === "student";
  const isSelectMode = currentMode === "select";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}`);
    }
  }, [isAuthenticated, user, navigate]);

  // Initialize Google One Tap ONLY for student mode (never for staff/admin)
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

  const instName = tenantInst?.name || instituteName || "Institution";
  const sysName = tenantInst?.settings?.systemName || systemName || "Faculty Feedback";
  const allowedDomain = tenantInst?.settings?.domainRestriction || domainRestriction || (portalSlug ? `${portalSlug}.ac.in` : "");
  const logoUrl = getFormattedLogoUrl(tenantInst?.logoUrl || tenantInst?.settings?.logoUrl || "");

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Loading institution login portal...</p>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Portal Access Suspended</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Access to this institution portal has been temporarily suspended by platform administration.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold no-underline transition-all"
        >
          Return to Platform Home
        </Link>
      </div>
    );
  }

  if (!tenantInst) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20 mb-3 uppercase tracking-wider">
          Portal Not Available
        </span>
        <h1 className="text-2xl font-bold mb-2">Institution Portal Not Found or Not Approved</h1>
        <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
          {tenantError || `The institution portal '/${portalSlug}' does not exist, has been deleted by platform administrators, or is pending verification.`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register-institution"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold no-underline transition-all shadow-lg shadow-blue-600/20"
          >
            Register Institution Application
          </Link>
          <Link
            to="/application-status"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold no-underline transition-all"
          >
            Check Application Status
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold no-underline transition-all"
          >
            Platform Landing Page
          </Link>
        </div>
      </div>
    );
  }

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
              console.warn("Google One Tap prompt failed to display.");
            }
          });
        } catch {
          console.error("Google prompt failed.");
        }
      }
    }
  };

  // Staff login handler — calls /api/auth/staff/login, ZERO Google OAuth
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState(true);
    setErrorMsg("");
    try {
      await staffLogin(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid username or password.");
      setLoadingState(false);
    }
  };

  // Admin login handler — calls /api/auth/login
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

  const navigateToMode = (mode: LoginMode) => {
    setErrorMsg("");
    setEmail("");
    setPassword("");
    if (mode === "select") {
      navigate("?");
    } else {
      navigate(`?mode=${mode}`);
    }
  };

  // Role selector cards for the initial screen
  const roleCards = [
    {
      mode: "student" as LoginMode,
      label: "Student",
      icon: <GraduationCap className="w-6 h-6" />,
      desc: "Sign in with your institutional Google account",
      color: "blue",
      bgClass: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconClass: "bg-blue-100 text-blue-700",
      textClass: "text-blue-900",
    },
    {
      mode: "faculty" as LoginMode,
      label: "Faculty",
      icon: <BookOpen className="w-6 h-6" />,
      desc: "Sign in with your email and password",
      color: "emerald",
      bgClass: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
      iconClass: "bg-emerald-100 text-emerald-700",
      textClass: "text-emerald-900",
    },
    {
      mode: "hod" as LoginMode,
      label: "HOD",
      icon: <Users className="w-6 h-6" />,
      desc: "Sign in with your email and password",
      color: "purple",
      bgClass: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      iconClass: "bg-purple-100 text-purple-700",
      textClass: "text-purple-900",
    },
    {
      mode: "dean" as LoginMode,
      label: "Dean",
      icon: <Building2 className="w-6 h-6" />,
      desc: "Sign in with your email and password",
      color: "amber",
      bgClass: "bg-amber-50 hover:bg-amber-100 border-amber-200",
      iconClass: "bg-amber-100 text-amber-700",
      textClass: "text-amber-900",
    },
    {
      mode: "admin" as LoginMode,
      label: "Administrator",
      icon: <Shield className="w-6 h-6" />,
      desc: "Sign in with your admin credentials",
      color: "slate",
      bgClass: "bg-slate-50 hover:bg-slate-100 border-slate-200",
      iconClass: "bg-slate-200 text-slate-700",
      textClass: "text-slate-900",
    },
  ];

  const getPortalTitle = () => {
    if (isSelectMode) return instName;
    return ROLE_LABELS[currentMode];
  };

  const getPortalSubtitle = () => {
    if (isSelectMode) return "Select your role to sign in";
    if (isStudentMode) return "Sign in with your official institutional Google account";
    if (isStaffMode) return `Sign in with your official email and password`;
    return "Sign in with your administrator credentials";
  };

  return (
    <AuthPageLayout
      brandTitle={instName}
      brandSubtitle={`${sysName} Feedback Portal`}
      headerRightAction={
        <Link
          to={location.pathname.startsWith("/college/") ? location.pathname.replace(/\/login.*$/, "") : (portalSlug ? `/college/${portalSlug}` : "/")}
          className="text-xs font-semibold text-slate-600 hover:text-[#0B3D91] transition-colors no-underline flex items-center gap-1"
        >
          <span>← College Home</span>
        </Link>
      }
      icon={
        logoUrl ? (
          <img src={logoUrl} alt={instName} className="h-8 w-auto object-contain max-w-[120px]" />
        ) : (
          <Lock className="w-6 h-6" />
        )
      }
      title={getPortalTitle()}
      subtitle={getPortalSubtitle()}
      errorMessage={errorMsg}
      backLink={
        !isSelectMode
          ? {
              label: "Back to Role Selection",
              onClick: () => navigateToMode("select"),
            }
          : {
              label: "Back to College Portal Home",
              to: location.pathname.startsWith("/college/") ? location.pathname.replace(/\/login.*$/, "") : (portalSlug ? `/college/${portalSlug}` : "/"),
            }
      }
      footerText={`© ${new Date().getFullYear()} ${instName} • All rights reserved`}
    >
      {/* Privacy banner for student mode */}
      {isStudentMode && <div className="mb-5"><PrivacyBanner compact /></div>}

      {/* ============================================================
          ROLE SELECTOR SCREEN
      ============================================================ */}
      {isSelectMode && (
        <div className="space-y-2">
          {roleCards.map((card) => (
            <button
              key={card.mode}
              type="button"
              onClick={() => navigateToMode(card.mode)}
              className={`w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-all cursor-pointer ${card.bgClass}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.iconClass}`}>
                {card.icon}
              </div>
              <div>
                <div className={`text-sm font-bold ${card.textClass}`}>{card.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{card.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ============================================================
          STUDENT — Google OAuth
      ============================================================ */}
      {isStudentMode && (
        <div className="space-y-4 text-center">
          {googleLoginEnabled ? (
            <>
              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={loadingState}
                className="w-full py-3 px-4 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loadingState ? "Authenticating..." : "Continue with Google"}</span>
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Use your official institutional Google account.
              </p>
              <div id="google-signin-btn-hidden" className="hidden"></div>
            </>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs text-amber-800 font-semibold mb-1">Google Sign-In Disabled</p>
              <p className="text-[11px] text-amber-600 leading-normal">
                Google sign-in is currently disabled by the administrator. Please try again later.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          FACULTY / HOD / DEAN — Staff Login
      ============================================================ */}
      {isStaffMode && (
        <div className="space-y-4">
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`name@${allowedDomain}`}
                autoComplete="email"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer border-0 bg-transparent"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingState}
              className="w-full py-2.5 sm:py-3 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              {loadingState ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 pt-1">
            Sign in with your institutional email and password.
            <br />
            Google Sign-In is not available for staff accounts.
          </p>
        </div>
      )}

      {/* ============================================================
          ADMIN — Manual username + password
      ============================================================ */}
      {isAdminMode && (
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address / Institutional ID
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`user@${allowedDomain}`}
              autoComplete="email"
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer border-0 bg-transparent"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingState}
            className="w-full py-2.5 sm:py-3 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            {loadingState ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Lock size={15} />
                <span>Sign In Securely</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Security Badge */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px] text-center">
        <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
        <span>256-bit encrypted &nbsp;·&nbsp; {sysName} Secure Portal</span>
      </div>
    </AuthPageLayout>
  );
};

export default LoginPage;
