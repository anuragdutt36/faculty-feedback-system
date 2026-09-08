import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Building2,
  Search,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL } from "../../services/api.js";
import { AuthPageLayout } from "../../components/common/AuthPageLayout.js";

interface InstitutionItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  city?: string;
  state?: string;
}

export const InstitutionLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInst, setSelectedInst] = useState<InstitutionItem | null>(null);
  const [customSlug, setCustomSlug] = useState("");
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setInstitutions([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        let res = await fetch(`${API_BASE_URL}/institutions/active-tenants?search=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) {
          res = await fetch(`${API_BASE_URL}/institutions/public-list?search=${encodeURIComponent(searchQuery)}`);
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const mapped = data.data.map((item: any) => ({
              id: item.institutionId || item._id,
              name: item.name,
              slug: item.slug,
              type: item.type || "Autonomous Institute",
              city: item.city,
              state: item.state,
            }));
            setInstitutions(mapped);
          }
        }
      } catch {
        // Handle error silently
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleContinue = () => {
    if (!selectedInst) {
      setErrorMsg("Please select an institution to proceed.");
      return;
    }
    navigate(`/college/${selectedInst.slug}`);
  };

  const handleCustomSlugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = customSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanSlug) {
      setErrorMsg("Please enter a valid institution code or identifier.");
      return;
    }
    navigate(`/college/${cleanSlug}`);
  };

  const filtered = institutions;

  return (
    <AuthPageLayout
      icon={<Building2 className="w-6 h-6" />}
      title="Sign in to your institution"
      subtitle="Find your college to continue to your institution feedback portal."
      errorMessage={errorMsg}
      backLink={{
        to: "/",
        label: "Back to Platform Home",
      }}
      footerText="Faculty Feedback Multi-Institution Platform • Institution Portal Gateway"
    >
      <div className="space-y-4">
        {/* Search Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Find Your Institution
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setErrorMsg("");
              }}
              placeholder="Search by college name or city..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Institution Results List - Directly connected visually below search field */}
        {searchQuery.trim().length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {isSearching ? (
              <div className="text-center py-3 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                Searching institution directory...
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((inst) => {
                const isSelected = selectedInst?.slug === inst.slug;
                return (
                  <button
                    key={inst.id || inst.slug}
                    type="button"
                    onClick={() => {
                      setSelectedInst(inst);
                      setErrorMsg("");
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-[#0B3D91] shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className={`font-semibold text-xs sm:text-sm truncate ${isSelected ? "text-[#0B3D91]" : "text-slate-900"}`}>
                        {inst.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          /{inst.slug}
                        </span>
                        {inst.city && <span>• {inst.city}, {inst.state || ""}</span>}
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-[#0B3D91] shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-3.5 px-3 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No matching institutions found in directory.
              </div>
            )}
          </div>
        )}

        {/* Start typing helper prompt if search query is empty */}
        {searchQuery.trim().length === 0 && (
          <div className="text-center py-2.5 px-3 text-xs text-slate-400">
            Start typing to find your institution
          </div>
        )}

        {/* Selected Summary & CTA */}
        {selectedInst && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Continue to {selectedInst.name.split(" ")[0]} Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Secondary Action: Institution Code / Subdomain */}
        <div className="pt-3 border-t border-slate-100 text-center">
          {!showDirectInput ? (
            <button
              type="button"
              onClick={() => setShowDirectInput(true)}
              className="text-xs text-slate-500 hover:text-[#0B3D91] transition-colors cursor-pointer inline-flex items-center gap-1 bg-transparent border-0"
            >
              <span>Have an institution code or custom subdomain?</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <form onSubmit={handleCustomSlugSubmit} className="space-y-2 text-left pt-1">
              <label className="block text-xs font-semibold text-slate-700">
                Enter Institution Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => {
                    setCustomSlug(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="e.g. knit"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer border-0"
                >
                  Go
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Platform Admin Secondary Link */}
        <div className="pt-2 text-center">
          <p className="text-xs text-slate-500">
            Are you a platform administrator?{" "}
            <Link
              to="/platform-admin/login"
              className="text-[#0B3D91] hover:underline font-semibold ml-1 inline-flex items-center gap-0.5"
            >
              <span>Platform Admin Login</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default InstitutionLoginPage;
