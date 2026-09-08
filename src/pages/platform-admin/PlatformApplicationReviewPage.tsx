import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Building2,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  Save,
  AlertCircle,
  FileText
} from "lucide-react";
import { platformService } from "../../services/platform.service.js";
import { InstitutionApplicationItem, VerificationChecklist } from "../../types/platform.js";
import { useTheme } from "../../context/ThemeContext.js";

export const PlatformApplicationReviewPage: React.FC = () => {
  const { dark } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<InstitutionApplicationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");

  // Checklist state
  const [checklist, setChecklist] = useState<VerificationChecklist>({
    institutionDetailsChecked: false,
    officialWebsiteChecked: false,
    officialEmailDomainMatch: false,
    recognitionAffiliationChecked: false,
    representativeVerified: false,
    documentsReviewed: false,
    duplicateChecked: false,
  });

  const [adminNotes, setAdminNotes] = useState("");

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Under Review State
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadApplication = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await platformService.getApplicationById(id);
      if (res && res.success) {
        setApplication(res.data);
        if (res.data.verificationChecklist) {
          setChecklist(res.data.verificationChecklist);
        }
        setAdminNotes(res.data.adminNotes || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load application details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const handleChecklistToggle = async (key: keyof VerificationChecklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);

    try {
      if (id) {
        await platformService.updateChecklist(id, updated, adminNotes);
        setSuccessNotice("Verification checklist auto-saved.");
        setTimeout(() => setSuccessNotice(""), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update checklist item.");
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    try {
      await platformService.updateChecklist(id, checklist, adminNotes);
      setSuccessNotice("Internal administrative notes saved.");
      setTimeout(() => setSuccessNotice(""), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to save admin notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handlePutUnderReview = async () => {
    if (!id) return;
    setUpdatingStatus(true);
    try {
      const res = await platformService.putUnderReview(id, adminNotes);
      if (res && res.success) {
        setApplication(res.data);
        setSuccessNotice("Application status updated to UNDER REVIEW.");
        setTimeout(() => setSuccessNotice(""), 2500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to set status to under review.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !rejectionReason.trim()) return;
    setRejecting(true);
    try {
      const res = await platformService.rejectApplication(id, rejectionReason, adminNotes);
      if (res && res.success) {
        setApplication(res.data);
        setShowRejectModal(false);
        setSuccessNotice("Application has been declined and notification dispatched.");
        setTimeout(() => setSuccessNotice(""), 2500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reject application.");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-10 h-10 border-3 border-[#0B3D91]/30 border-t-[#0B3D91] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading institution review workspace...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${dark ? "bg-[#0B1528] border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"}`}>
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>Application Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested application ID does not exist.</p>
        <Link
          to="/platform-admin/applications"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-[#0B3D91] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications</span>
        </Link>
      </div>
    );
  }

  const checklistItems = [
    { key: "institutionDetailsChecked", label: "Institution details and location verified" },
    { key: "officialWebsiteChecked", label: "Official website domain verified active" },
    { key: "officialEmailDomainMatch", label: "Representative email domain matches institution website" },
    { key: "recognitionAffiliationChecked", label: "Affiliation / Recognition / Statutory status checked" },
    { key: "representativeVerified", label: "Authorized representative designation checked" },
    { key: "documentsReviewed", label: "Supporting accreditation/affiliation documents reviewed" },
    { key: "duplicateChecked", label: "Duplicate institution / multi-campus check passed" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${dark ? "border-slate-800/80" : "border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <Link
            to="/platform-admin/applications"
            className={`p-2 rounded-xl border transition-colors ${
              dark ? "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{application.referenceId}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  application.status === "APPROVED"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : application.status === "PENDING"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : application.status === "UNDER_REVIEW"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}
              >
                {application.status.replace("_", " ")}
              </span>
            </div>
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight mt-0.5 ${dark ? "text-white" : "text-slate-900"}`}>
              {application.institutionName}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {application.status === "PENDING" && (
            <button
              onClick={handlePutUnderReview}
              disabled={updatingStatus}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                dark
                  ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Put Under Review</span>
            </button>
          )}

          {application.status !== "REJECTED" && application.status !== "APPROVED" && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Application</span>
            </button>
          )}

          {application.status !== "APPROVED" && application.status !== "REJECTED" && (
            <button
              onClick={() => {
                navigate(`/platform-admin/applications/${application._id}/approve`);
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve &amp; Create Tenant</span>
            </button>
          )}

          {application.status === "APPROVED" && (
            <a
              href={`/college/${(application as any).collegeCode || "knit"}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer no-underline"
            >
              <span>View Institution Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {application.status === "REJECTED" && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Application Rejected</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            Rejection Reason: {application.rejectionReason || "Unable to verify institution details."}
          </p>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {(application as any).isUnverifiedManualEntry && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Manual / Unlisted Entry Warning:</strong> The institution name "<strong>{application.institutionName}</strong>" was entered manually and was not found in the recognized higher education directory. Please perform manual verification of accreditation documents before approving.
          </span>
        </div>
      )}

      {/* Official Email Verification Signal Banner */}
      <div
        className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          application.domainMatchVerified
            ? dark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : "bg-emerald-50 border-emerald-200 text-emerald-800"
            : dark ? "bg-amber-500/10 border-amber-500/30 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              application.domainMatchVerified
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}
          >
            {application.domainMatchVerified ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="font-bold text-sm">
              {application.domainMatchVerified
                ? "Official Email Domain Verified"
                : "Additional Verification Required (Domain Mismatch / Generic Provider)"}
            </div>
            <p className="text-[11px] opacity-90 mt-0.5">
              Applicant Email: <span className="font-mono font-semibold">{application.representativeEmail}</span> •
              Website: <span className="font-mono font-semibold">{application.officialWebsite}</span>
            </p>
          </div>
        </div>

        <div className="text-[11px] opacity-80 self-start sm:self-auto font-medium">
          Signal Score: {application.domainMatchVerified ? "High Trust" : "Manual Review Required"}
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Institution & Representative Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Institution Metadata Card */}
          <div
            className={`rounded-2xl p-5 sm:p-6 border transition-all ${
              dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className={`flex items-center gap-2.5 pb-4 border-b mb-4 ${dark ? "border-slate-800" : "border-slate-100"}`}>
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>Institution Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Institution Name</span>
                <span className={`font-semibold text-sm mt-0.5 block ${dark ? "text-slate-100" : "text-slate-900"}`}>
                  {application.institutionName}
                </span>
              </div>

              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Institution Type</span>
                <span className={`font-semibold mt-0.5 block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  {application.institutionType}
                </span>
              </div>

              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Official Website</span>
                <a
                  href={application.officialWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                >
                  <span>{application.officialWebsite}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Official Email</span>
                <span className={`font-mono mt-0.5 block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  {application.officialEmail}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Campus Location</span>
                <span className={`mt-0.5 block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  {application.fullAddress}, {application.city}, {application.state}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Affiliation / Recognition Information</span>
                <div className={`p-3 rounded-xl border mt-1 leading-relaxed ${dark ? "bg-slate-900/80 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                  {application.affiliationDetails || "No affiliation details provided."}
                </div>
              </div>

              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Approximate Students</span>
                <span className={`font-semibold mt-0.5 block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  {application.approxStudents?.toLocaleString() || "0"}
                </span>
              </div>

              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Approximate Faculty</span>
                <span className={`font-semibold mt-0.5 block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  {application.approxFaculty?.toLocaleString() || "0"}
                </span>
              </div>

              {application.supportingDocumentUrl && (
                <div className={`sm:col-span-2 pt-2 border-t ${dark ? "border-slate-800" : "border-slate-100"}`}>
                  <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Supporting Accreditation Document</span>
                  <a
                    href={application.supportingDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium mt-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Submitted Verification Document</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Authorized Representative Card */}
          <div
            className={`rounded-2xl p-5 sm:p-6 border transition-all ${
              dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className={`flex items-center gap-2.5 pb-4 border-b mb-4 ${dark ? "border-slate-800" : "border-slate-100"}`}>
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>Authorized Representative</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Full Name</span>
                <span className={`font-semibold text-sm mt-0.5 block ${dark ? "text-slate-100" : "text-slate-900"}`}>
                  {application.representativeName}
                </span>
              </div>

              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Designation</span>
                <span className={`font-semibold mt-0.5 block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  {application.representativeDesignation}
                </span>
              </div>

              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Official Representative Email</span>
                <span className={`font-mono mt-0.5 block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  {application.representativeEmail}
                </span>
              </div>

              <div>
                <span className={`block text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Contact Phone</span>
                <span className={`font-mono mt-0.5 block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  {application.representativePhone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Checklist & Admin Notes */}
        <div className="space-y-6">
          {/* Verification Checklist Card */}
          <div
            className={`rounded-2xl p-5 border transition-all ${
              dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b mb-3 ${dark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-white" : "text-slate-900"}`}>
                  Verification Checklist
                </h3>
              </div>
              <span className={`text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Auto-saved</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {checklistItems.map((item) => {
                const isChecked = Boolean((checklist as any)[item.key]);
                return (
                  <label
                    key={item.key}
                    className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                      dark ? "hover:bg-slate-900/80" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleChecklistToggle(item.key as keyof VerificationChecklist)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 mt-0.5 cursor-pointer"
                    />
                    <span className={`text-[11px] leading-snug ${isChecked ? (dark ? "text-slate-200 font-medium" : "text-slate-900 font-semibold") : "text-slate-400"}`}>
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Internal Admin Notes Card */}
          <div
            className={`rounded-2xl p-5 border transition-all space-y-3 ${
              dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-white" : "text-slate-900"}`}>
                Internal Admin Notes
              </h3>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-2.5 py-1 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3 h-3" />
                <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Record internal verification notes, website domain checks, or follow-up notes (strictly private)..."
              className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                dark ? "bg-slate-900 border-slate-700/80 text-slate-100 placeholder-slate-400" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
              }`}
            />
            <p className={`text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
              * Internal notes are only visible to Platform Administrators.
            </p>
          </div>

          {/* Review Info */}
          {application.reviewedBy && (
            <div className={`p-3.5 rounded-xl border text-[11px] space-y-1 ${dark ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              <div>
                Last reviewed by: <span className={`font-medium ${dark ? "text-slate-200" : "text-slate-900"}`}>{application.reviewedBy.name}</span>
              </div>
              {application.reviewedAt && (
                <div>Date: {new Date(application.reviewedAt).toLocaleString()}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal Popup */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div
            className={`border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 ${
              dark ? "bg-[#091124] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 pb-3 border-b border-slate-200 dark:border-slate-800">
              <XCircle className="w-5 h-5" />
              <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                Decline Institution Application
              </h3>
            </div>

            <p className={`text-xs leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>
              Please state the specific reason for rejecting the application of <strong>{application.institutionName}</strong>. This reason will be logged and communicated to the applicant.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Official website domain could not be verified; accreditation order unverifiable..."
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    dark ? "bg-slate-900 border-slate-700/80 text-slate-100 placeholder-slate-400" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {rejecting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Declining...</span>
                    </>
                  ) : (
                    <span>Confirm Rejection</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformApplicationReviewPage;
