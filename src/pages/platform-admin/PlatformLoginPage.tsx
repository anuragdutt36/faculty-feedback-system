import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { Shield, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";
import { usePlatformAuth } from "../../context/PlatformAuthContext.js";
import { AuthPageLayout } from "../../components/common/AuthPageLayout.js";

export const PlatformLoginPage: React.FC = () => {
  const { platformLogin, isPlatformAuthenticated } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/platform-admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isPlatformAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isPlatformAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both administrator email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await platformLogin(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      let finalMessage = "Invalid administrator email or password. Please verify your credentials and try again.";
      try {
        if (typeof err === "string" && err.trim() && err !== "[object Object]") {
          finalMessage = err;
        } else if (err?.response?.data?.message) {
          finalMessage = err.response.data.message;
        } else if (err?.message && typeof err.message === "string" && err.message !== "[object Object]") {
          finalMessage = err.message;
        }
      } catch (e) {
        // Fallback
      }
      if (typeof finalMessage !== "string" || finalMessage.includes("[object Object]")) {
        finalMessage = "Invalid administrator email or password. Please verify your credentials and try again.";
      }
      setErrorMessage(finalMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillDefault = () => {
    setUsername("platform.admin@facultyfeedback.in");
    setPassword("PlatformAdmin2026!");
    setErrorMessage("");
  };

  return (
    <AuthPageLayout
      brandTitle="Faculty Feedback"
      brandSubtitle="Platform Superadmin Gateway"
      icon={<Shield className="w-6 h-6" />}
      title="Platform Administration"
      subtitle="Sign in to manage registered institutions and platform-level settings."
      errorMessage={errorMessage}
      backLink={{
        to: "/",
        label: "Back to Platform Home",
      }}
      footerText="Faculty Feedback Multi-Institution Platform • Restricted Operator Gateway"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Platform Admin Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="admin@facultyfeedback.in"
              className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-[#0B3D91] hover:underline font-medium cursor-pointer border-0 bg-transparent"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="••••••••••••"
              className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border-0"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>Sign In to Platform Admin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Fill for local development */}
      <div className="mt-5 pt-4 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={handleQuickFillDefault}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Fill Default Platform Credentials</span>
        </button>
      </div>

      {/* Switch to Institution Login */}
      <div className="mt-3 pt-3 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Are you an institution administrator or student?{" "}
          <button
            type="button"
            onClick={() => navigate("/institution-login")}
            className="text-[#0B3D91] hover:underline font-semibold inline-flex items-center gap-1 ml-1 cursor-pointer bg-transparent border-0"
          >
            <span>Institution Login</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </p>
      </div>
    </AuthPageLayout>
  );
};

export default PlatformLoginPage;
