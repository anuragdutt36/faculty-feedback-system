import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import {
  Building2,
  Search,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { API_BASE_URL, getFormattedLogoUrl } from "../../services/api.js";
import { AuthPageLayout } from "../../components/common/AuthPageLayout.js";

interface InstitutionItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  city?: string;
  state?: string;
  logoUrl?: string;
}

export const InstitutionLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allInstitutions, setAllInstitutions] = useState<InstitutionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Check URL query parameters for preselected college
  const paramSlug = searchParams.get("slug") || searchParams.get("college") || searchParams.get("inst");

  // Fetch active institutions on component mount
  useEffect(() => {
    const fetchInstitutions = async () => {
      setIsLoading(true);
      try {
        let res = await fetch(`${API_BASE_URL}/institutions/active-tenants`);
        if (!res.ok) {
          res = await fetch(`${API_BASE_URL}/institutions/public-list`);
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const mapped: InstitutionItem[] = data.data.map((item: any) => ({
              id: item.institutionId || item._id,
              name: item.name,
              slug: item.slug,
              type: item.type || "Autonomous Institute",
              city: item.city,
              state: item.state,
              logoUrl: item.logoUrl,
            }));
            setAllInstitutions(mapped);

            // If paramSlug matches an institution, auto-navigate to it
            if (paramSlug) {
              const matched = mapped.find(
                (i) => i.slug.toLowerCase() === paramSlug.toLowerCase()
              );
              if (matched) {
                navigate(`/college/${matched.slug}`);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load institutions", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstitutions();
  }, [paramSlug, navigate]);

  const handleCustomSlugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = customSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanSlug) {
      setErrorMsg("Please enter a valid institution code or identifier.");
      return;
    }
    navigate(`/college/${cleanSlug}`);
  };

  // Filter institutions by search query - MUST START WITH the query
  const filtered = searchQuery.trim()
    ? allInstitutions.filter((inst) => {
        const query = searchQuery.toLowerCase();
        return (
          inst.name.toLowerCase().startsWith(query) ||
          inst.slug.toLowerCase().startsWith(query) ||
          (inst.city && inst.city.toLowerCase().startsWith(query)) ||
          (inst.state && inst.state.toLowerCase().startsWith(query))
        );
      })
    : allInstitutions;

  return (
    <AuthPageLayout
      icon={<Building2 className="w-6 h-6 text-[#0B3D91]" />}
      title="Sign in to Institution"
      subtitle="Select your college to access student feedback or academic portals"
      errorMessage={errorMsg}
      backLink={{
        to: "/",
        label: "Back to Platform Home",
      }}
    >
      <div className="space-y-4">
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Find Your College / Institution
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
                placeholder="Search by college name, city or code..."
                autoFocus
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
              />
            </div>
          </div>

          {/* Institution List (Only shown when search query is entered) */}
          {searchQuery.trim().length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  Searching active institutions...
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((inst) => (
                  <button
                    key={inst.id || inst.slug}
                    type="button"
                    onClick={() => {
                      navigate(`/college/${inst.slug}`);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/90 hover:border-[#0B3D91]/40 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      {inst.logoUrl ? (
                        <img
                          src={getFormattedLogoUrl(inst.logoUrl)}
                          alt={inst.name}
                          className="w-9 h-9 object-contain rounded-lg bg-white p-0.5 border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-[#0B3D91] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#0B3D91] group-hover:text-white transition-colors">
                          <Building2 size={16} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-900 group-hover:text-[#0B3D91] transition-colors truncate">
                          {inst.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            /{inst.slug}
                          </span>
                          {inst.city && <span>• {inst.city}, {inst.state || ""}</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3D91] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))
              ) : (
                <div className="text-center py-4 px-3 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  No matching institutions found for &ldquo;<span className="font-semibold text-slate-700">{searchQuery}</span>&rdquo;.
                </div>
              )}
            </div>
          ) : (
            /* Clean initial state prompt when no search query has been typed yet */
            <div className="text-center py-5 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-500">
              <Search className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-slate-700">Type to find your institution</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter college name, city, or institution code (e.g. KNIT, REC Banda)
              </p>
            </div>
          )}

          {/* Direct Institution Code Option */}
          <div className="pt-2 border-t border-slate-100 text-center">
            {!showDirectInput ? (
              <button
                type="button"
                onClick={() => setShowDirectInput(true)}
                className="text-sm text-slate-500 hover:text-[#0B3D91] transition-colors cursor-pointer inline-flex items-center gap-1 bg-transparent border-0 font-medium"
              >
                <span>Have an institution code or custom subdomain?</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <form onSubmit={handleCustomSlugSubmit} className="space-y-2 text-left pt-1">
                <label className="block text-sm font-medium text-slate-700">
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
                    placeholder="e.g. knit or recbanda"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all cursor-pointer border-0"
                  >
                    Go
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Platform Admin Secondary Link */}
          <div className="pt-1 text-center">
            <p className="text-sm text-slate-500">
              Are you a platform super-administrator?{" "}
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
      </div>
    </AuthPageLayout>
  );
};

export default InstitutionLoginPage;
