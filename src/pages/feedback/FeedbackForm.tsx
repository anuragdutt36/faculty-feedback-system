import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  CheckCircle2, ShieldCheck, LayoutDashboard, Send, ChevronLeft, ChevronRight,
  Users, Building2, Clock, AlertOctagon, Star, Loader2, ArrowLeft, ArrowRight
} from "lucide-react";
import { LogoMark } from "../../components/common/LogoMark.js";
import { PrivacyBanner } from "../../components/common/PrivacyBanner.js";
import { Badge } from "../../components/common/Badge.js";
import { useAuth } from "../../context/AuthContext.js";

const ratingOptions = [
  { value: 5, label: "Excellent" },
  { value: 4, label: "Very Good" },
  { value: 3, label: "Good" },
  { value: 2, label: "Average" },
  { value: 1, label: "Poor" },
];
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { studentService } from "../../services/student.service.js";
import { cn } from "../../components/admin/AdminShared.js";

export const FeedbackForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dark } = useTheme();
  const { systemName, anonymousFeedback } = useSettings();
  const [searchParams] = useSearchParams();

  // Query Params
  const sessionId = searchParams.get("session") || "";
  const subjectId = searchParams.get("subject") || "";
  const facultyId = searchParams.get("faculty") || "";
  const mappingId = searchParams.get("mapping") || "";

  // Page States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Data States
  const [session, setSession] = useState<any | null>(null);
  const [subject, setSubject] = useState<any | null>(null);
  const [faculty, setFaculty] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Form States
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [currentIdx, setCurrentIdx] = useState(0);

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8";
  const headerBg = dark ? "bg-[#0A1128]/95 border-white/10" : "bg-[#EEF2F8]/95 border-[#0B3D91]/8";

  const ratingColors: Record<number, string> = {
    5: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    4: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    3: "border-[#0B3D91] bg-[#EEF2F8] text-[#0B3D91] dark:bg-white/10 dark:text-blue-200",
    2: "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    1: "border-red-400 bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  };

  const loadFormData = async () => {
    try {
      const res = await studentService.getActiveSessions();
      if (res?.success && res.data) {
        const matchingSess = res.data.find((as: any) => as.session.id === sessionId);
        if (!matchingSess) {
          setErrorMessage("Feedback session not found or inactive.");
          return;
        }
        setSession(matchingSess.session);
        setQuestions(matchingSess.session.questions || []);

        const matchingSub = matchingSess.subjects.find((s: any) => s.mappingId === mappingId || s.subject?._id === subjectId);
        if (!matchingSub) {
          setErrorMessage("Subject mapping not found for this session.");
          return;
        }
        setSubject(matchingSub.subject);
        setFaculty(matchingSub.faculty);
        setAlreadySubmitted(matchingSub.submitted);
        
        if (matchingSub.submitted) {
          setErrorMessage("Feedback already submitted for this session.");
        }
      } else {
        setErrorMessage("Failed to fetch feedback campaign details.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to load form.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId && mappingId) {
      loadFormData();
    } else {
      setErrorMessage("Missing session or mapping identifiers.");
      setLoading(false);
    }
  }, [sessionId, mappingId]);

  const allAnswered = questions.length > 0 && questions.every((q) => ratings[q._id] !== undefined);

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tokenRes = await studentService.getSubmissionToken(sessionId, subjectId, facultyId);
      if (!tokenRes?.success || !tokenRes.data?.token) {
        throw new Error(tokenRes?.message || "Failed to authorize submission.");
      }
      const token = tokenRes.data.token;

      const ratingsPayload = Object.entries(ratings).map(([qId, rating]) => ({
        questionId: qId,
        rating,
      }));

      const submitRes = await studentService.submitFeedback(token, ratingsPayload);
      if (submitRes?.success) {
        setStep("success");
      } else {
        throw new Error(submitRes?.message || "Submission failed.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6", dark ? "bg-[#0A1128]" : "bg-[#EEF2F8]")}>
        <Loader2 className="animate-spin text-[#0B3D91]" size={36} />
      </div>
    );
  }

  if (errorMessage && !alreadySubmitted) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6", dark ? "bg-[#0A1128]" : "bg-[#EEF2F8]")} style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className={cn("rounded-3xl p-8 max-w-md w-full text-center border shadow-lg", cardBg)}>
          <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-4 dark:bg-red-900/30 dark:border-red-800">
            <AlertOctagon size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className={cn("font-bold text-lg mb-2", textPrimary)}>Submission Blocked</h2>
          <p className={cn("text-xs mb-6", textSub)}>{errorMessage}</p>
          <button onClick={() => navigate("/student")} className="w-full py-3 rounded-xl bg-[#0B3D91] text-white text-xs font-semibold hover:bg-[#0a348a] transition-all cursor-pointer border-0">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6", dark ? "bg-[#0A1128]" : "bg-[#EEF2F8]")} style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className={cn("rounded-3xl p-8 max-w-md w-full text-center border shadow-xl", cardBg)}>
          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4 dark:bg-emerald-900/30 dark:border-emerald-800">
            <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <Badge variant="success" className="mb-3">Feedback Recorded</Badge>
          <div className="mb-2" />
          <p className={cn("text-xs leading-relaxed mb-6", textSub)}>
            Your evaluation for <span className="font-semibold text-white">{faculty?.name}</span> ({subject?.name}) has been submitted successfully.
          </p>
          {anonymousFeedback ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left mb-6 flex items-start gap-3">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed dark:text-emerald-300">
                <span className="font-semibold">Fully Anonymous:</span> Your submission token has been purged from active pools. It is mathematically impossible to trace this response back to your account.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left mb-6 flex items-start gap-3">
              <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed dark:text-blue-300">
                <span className="font-semibold">Identity Recorded:</span> Your student identity has been recorded securely by the administration.
              </p>
            </div>
          )}
          <button onClick={() => navigate("/student")} className="w-full py-3.5 rounded-xl bg-[#0B3D91] text-white font-semibold text-sm hover:bg-[#0a348a] transition-all shadow-lg shadow-[#0B3D91]/20 flex items-center justify-center gap-2 cursor-pointer border-0">
            <LayoutDashboard size={15} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6 z-50 fixed inset-0 backdrop-blur-sm bg-black/60")} style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className={cn("rounded-3xl shadow-2xl p-8 max-w-md w-full", cardBg, "bg-white dark:bg-[#132052]")}>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-5 dark:bg-amber-900/30 dark:border-amber-800">
            <Send size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className={cn("text-xl font-bold mb-2", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Confirm Submission</h2>
          <p className={cn("text-sm mb-5 leading-relaxed", textSub)}>
            You are about to submit feedback for <span className="font-semibold">{faculty?.name}</span> — <span className="font-semibold">{subject?.name}</span>. This action cannot be undone.
          </p>
          <div className={cn("p-4 rounded-xl border mb-5 space-y-2 text-xs", dark ? "bg-white/5 border-white/10" : "bg-[#EEF2F8] border-[#0B3D91]/8")}>
            <div className="flex items-center justify-between"><span className={textSub}>Questions answered</span><span className={cn("font-semibold", textPrimary)}>{Object.keys(ratings).length}/{questions.length}</span></div>
            <div className="flex items-center justify-between"><span className={textSub}>Identity stored</span><span className={cn("font-semibold", anonymousFeedback ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>{anonymousFeedback ? "Never" : "Yes"}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("form")} className={cn("flex-1 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer", dark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-[#0B3D91]/15 text-[#0D1B3E] hover:bg-[#EEF2F8]")}>Edit</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#0a348a] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const totalSteps = questions.length;
  const answeredCount = Object.keys(ratings).length;
  const progressPercent = totalSteps > 0 ? Math.round((answeredCount / totalSteps) * 100) : 0;

  return (
    <div className={cn("min-h-screen w-full overflow-x-hidden", dark ? "bg-[#0A1128]" : "bg-[#EEF2F8]")} style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className={cn("sticky top-0 z-20 backdrop-blur-sm border-b px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between", headerBg)}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => navigate("/student")} aria-label="Back to dashboard" className={cn("p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer shrink-0", dark ? "bg-white/5 border-white/10 text-[#5A6E8E] hover:text-white" : "border-[#0B3D91]/10 bg-white text-[#5A6E8E] hover:text-[#0B3D91]")}>
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm truncate">
              <span className={cn(textSub, "hidden sm:inline")}>Student Dashboard</span>
              <ChevronRight size={14} className={cn(textSub, "hidden sm:inline shrink-0")} />
              <span className={cn("font-semibold truncate", textPrimary)}>Feedback Form</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {anonymousFeedback ? (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300">
              <ShieldCheck size={11} /> Anonymous &amp; Confidential
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
              <ShieldCheck size={11} /> Identity Recorded
            </div>
          )}
          <LogoMark size={28} className="w-7 h-7 shrink-0" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6 w-full max-w-full">
        {/* Faculty Card */}
        <div className={cn("rounded-2xl p-4 sm:p-6 border shadow-sm", cardBg)}>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center shrink-0">
              <Users size={20} className="text-white sm:w-[22px] sm:h-[22px]" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                  <Badge variant="info">{session?.academicYear || "2026-27"}</Badge>
                  <span className={cn("text-[10px] font-mono", textSub)}>{subject?.code}</span>
                </div>
                <div className={cn("text-[11px] sm:text-xs font-semibold flex items-center gap-1 shrink-0", textPrimary)}>
                  Progress: {progressPercent}%
                </div>
              </div>
              <h2 className={cn("font-bold text-base sm:text-lg leading-tight truncate", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{subject?.name}</h2>
              <p className={cn("text-xs sm:text-sm mt-0.5 truncate", textSub)}>{faculty?.name} &nbsp;·&nbsp; {user?.branch || "Computer Science"}</p>
              
              <div className={cn("h-1.5 w-full rounded-full mt-3 sm:mt-4", dark ? "bg-white/10" : "bg-[#EEF2F8]")}>
                <div className="h-full rounded-full bg-gradient-to-r from-[#0B3D91] to-[#3B82F6] transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <PrivacyBanner />

        {/* Paginated Questions */}
        <div className="space-y-3 sm:space-y-4">
          {questions.length === 0 ? (
            <div className={cn("rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm text-center", cardBg)}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-4 dark:bg-amber-900/30 dark:border-amber-800">
                <AlertOctagon size={22} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className={cn("font-bold text-base sm:text-lg mb-2", textPrimary)}>No Questions Configured</h3>
              <p className={cn("text-xs sm:text-sm", textSub)}>
                This feedback session has no active questions. Please notify the administration to configure questions for this session.
              </p>
            </div>
          ) : currentQ ? (
            <div className={cn("rounded-2xl sm:rounded-3xl p-4 sm:p-8 border shadow-sm transition-all duration-300", cardBg)}>
               <div className="flex items-center justify-between mb-4 sm:mb-6">
                 <span className={cn("px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold", dark ? "bg-white/10 text-white" : "bg-[#0B3D91]/10 text-[#0B3D91]")}>
                   Question {currentIdx + 1} of {questions.length}
                 </span>
                 <span className={cn("text-[10px] sm:text-xs font-semibold", textSub)}>
                   {currentQ?.category}
                 </span>
               </div>
               
               <p className={cn("text-base sm:text-xl font-medium mb-5 sm:mb-8 leading-relaxed", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                 {currentQ?.text}
               </p>
               
               <div className="grid grid-cols-5 gap-1 sm:gap-3">
                 {ratingOptions.map((opt) => {
                   const selected = ratings[currentQ._id] === opt.value;
                   const colorCls = ratingColors[opt.value];
                   return (
                     <button
                       key={opt.value}
                       type="button"
                       disabled={alreadySubmitted}
                       onClick={() => {
                         setRatings((prev) => ({ ...prev, [currentQ._id]: opt.value }));
                         if (currentIdx < questions.length - 1) {
                           setTimeout(handleNext, 300); // Auto-advance after 300ms if not last question
                         }
                       }}
                       className={cn(
                         "flex flex-col items-center justify-center p-1.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer disabled:opacity-50 min-w-0",
                         selected ? colorCls : dark ? "border-white/10 bg-white/5 text-white hover:border-white/30" : "border-[#0B3D91]/10 bg-[#EEF2F8] text-[#5A6E8E] hover:border-[#0B3D91]/30"
                       )}
                     >
                       <Star size={16} className={cn("mb-1 sm:mb-2 sm:w-6 sm:h-6", selected ? "fill-current" : "")} />
                       <span className="text-xs sm:text-sm font-bold">{opt.value}</span>
                       <span className="text-[8px] sm:text-[10px] uppercase tracking-wider opacity-80 truncate max-w-full">{opt.label}</span>
                     </button>
                   );
                 })}
               </div>
            </div>
          ) : null}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 sm:pt-4 gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={cn("flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer border-0", 
                currentIdx === 0 ? "opacity-0 pointer-events-none" : dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-[#0B3D91] hover:bg-[#EEF2F8] shadow-sm"
              )}
            >
              <ArrowLeft size={15} /> Previous
            </button>
            
            {currentIdx < questions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={ratings[currentQ?._id] === undefined}
                className={cn("flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer border-0", 
                  ratings[currentQ?._id] === undefined ? "opacity-50 pointer-events-none bg-gray-400 text-white" : "bg-[#0B3D91] text-white hover:bg-[#0a348a] shadow-[#0B3D91]/20"
                )}
              >
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => setStep("confirm")}
                disabled={!allAnswered || alreadySubmitted}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-0"
              >
                <CheckCircle2 size={15} /> Submit Feedback
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
