import React from "react";
import { Link } from "react-router";
import { GraduationCap, AlertCircle } from "lucide-react";

export interface AuthPageLayoutProps {
  /** Top Header Brand Title (Default: "Faculty Feedback") */
  brandTitle?: string;
  /** Top Header Subtitle (Default: "Academic Feedback Platform") */
  brandSubtitle?: string;
  /** Custom action on top-right of header (Default: "← Platform Home") */
  headerRightAction?: React.ReactNode;

  /** Card Header Icon Component */
  icon: React.ReactNode;
  /** Card Primary Heading Title */
  title: string;
  /** Card Subheading Description */
  subtitle: string;

  /** Optional error message banner at top of card content */
  errorMessage?: string;

  /** Main form or card content */
  children: React.ReactNode;

  /** Secondary Back Link rendered cleanly below the authentication card */
  backLink?: {
    to?: string;
    label: string;
    onClick?: () => void;
  };

  /** Additional content placed below the card */
  belowCardContent?: React.ReactNode;

  /** Footer text (Default: "Faculty Feedback Platform • Academic Quality Governance") */
  footerText?: string;
}

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  brandTitle = "Faculty Feedback",
  brandSubtitle = "Academic Feedback Platform",
  headerRightAction,
  icon,
  title,
  subtitle,
  errorMessage,
  children,
  backLink,
  belowCardContent,
  footerText = "Faculty Feedback Platform • Academic Quality Governance",
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between items-center px-4 py-6 sm:py-8">


      {/* Main Authentication Section */}
      <main className="w-full max-w-md my-auto relative z-10 py-1">
        {/* Auth Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Card Hero Icon & Titles */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#0B3D91] mb-3 mx-auto">
              {icon}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Optional Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form & Card Body */}
          {children}
        </div>

        {/* Secondary Back Navigation Link below card */}
        {backLink && (
          <div className="mt-4 text-center">
            {backLink.onClick ? (
              <button
                type="button"
                onClick={backLink.onClick}
                className="text-xs font-medium text-slate-500 hover:text-[#0B3D91] transition-colors cursor-pointer bg-transparent border-0 inline-flex items-center gap-1.5"
              >
                <span>← {backLink.label}</span>
              </button>
            ) : (
              <Link
                to={backLink.to || "/"}
                className="text-xs font-medium text-slate-500 hover:text-[#0B3D91] transition-colors no-underline inline-flex items-center gap-1.5"
              >
                <span>← {backLink.label}</span>
              </Link>
            )}
          </div>
        )}

        {belowCardContent}
      </main>

      {/* Consistent Page Footer */}
      <footer className="w-full max-w-md text-center text-xs text-slate-400 z-10 pt-4 pb-2">
        {footerText}
      </footer>
    </div>
  );
};
