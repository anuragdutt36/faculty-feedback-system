import React, { useState, useEffect, useRef } from "react";
import { Search, CheckCircle2, Building2, ShieldAlert, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../../services/api.js";

export interface CollegeSearchResult {
  name: string;
  aliases?: string[];
  type?: string;
  city?: string;
  state?: string;
  website?: string;
  collegeCode?: string;
  isRecognized?: boolean;
}

interface InstitutionNameAutocompleteProps {
  value: string;
  onChange: (value: string, isManual: boolean) => void;
  onSelectSuggestion?: (item: CollegeSearchResult) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const InstitutionNameAutocomplete: React.FC<InstitutionNameAutocompleteProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "e.g. Kamla Nehru Institute of Technology or KNIT",
  required = true,
  className = "",
}) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<CollegeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollegeSearchResult | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal query state if parent value changes externally
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Fetch matching institutions from backend (debounced)
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/institutions/search-colleges?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setSuggestions(data.data);
          }
        }
      } catch {
        // Handle fetch errors gracefully
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedItem(null);
    setIsManualEntry(true);
    setIsOpen(true);
    setHighlightedIndex(-1);
    onChange(val, true);
  };

  const handleSelectSuggestion = (item: CollegeSearchResult) => {
    setQuery(item.name);
    setSelectedItem(item);
    setIsManualEntry(false);
    setIsOpen(false);
    onChange(item.name, false);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
  };

  const handleSelectManual = () => {
    setSelectedItem(null);
    setIsManualEntry(true);
    setIsOpen(false);
    onChange(query, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") setIsOpen(true);
      return;
    }

    const totalOptions = suggestions.length + (query.trim() ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < totalOptions ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        if (highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else {
          handleSelectManual();
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input container */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Building2 className="w-4 h-4" />
        </div>

        <input
          type="text"
          required={required}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-white border rounded-lg pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all ${
            selectedItem
              ? "border-emerald-500 bg-emerald-50/10"
              : isManualEntry && query.trim()
              ? "border-amber-400"
              : "border-slate-300"
          } ${className}`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading ? (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : selectedItem ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Verification Status Badges below input */}
      {selectedItem ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Recognized Higher Education Institution Selected</span>
          {selectedItem.city && (
            <span className="text-emerald-600/80 font-normal">
              • {selectedItem.city}, {selectedItem.state}
            </span>
          )}
        </div>
      ) : isManualEntry && query.trim().length >= 3 ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-800 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Custom / Unlisted Institution (Flagged for Platform Admin Verification)</span>
        </div>
      ) : null}

      {/* Autocomplete Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
          {/* Directory Header */}
          <div className="bg-slate-50 border-b border-slate-100 px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0B3D91]" />
              <span>Recognized Institutions Directory (India)</span>
            </span>
            <span>{suggestions.length} matches</span>
          </div>

          {/* Suggestions List */}
          <div className="p-1 space-y-0.5">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={item.name + idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isHighlighted
                        ? "bg-blue-50 text-[#0B3D91] font-semibold"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.isRecognized && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-[#0B3D91] text-[10px] font-bold shrink-0">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        {item.type && <span>{item.type}</span>}
                        {item.city && <span>• {item.city}, {item.state}</span>}
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                );
              })
            ) : !loading ? (
              <div className="p-3 text-center text-xs text-slate-500">
                No matching institutions found in recognized list.
              </div>
            ) : null}

            {/* Manual Entry Fallback Option */}
            {query.trim().length > 0 && (
              <button
                type="button"
                onClick={handleSelectManual}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors border-t border-slate-100 flex items-center gap-2 cursor-pointer ${
                  highlightedIndex === suggestions.length
                    ? "bg-amber-50 text-amber-900 font-semibold"
                    : "hover:bg-amber-50/60 text-slate-700"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 truncate">
                    Use custom name: <span className="font-bold text-amber-900">"{query.trim()}"</span>
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">
                    Will be submitted as an unlisted institution and flagged for manual admin review.
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
