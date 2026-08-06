import React from "react";
import { Search, FileText, RefreshCw, Star } from "lucide-react";
import { Badge } from "../common/Badge.js";
import { StatusDot } from "../common/StatusDot.js";

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ModHeader({ title, sub, dark, children }: { title: string; sub?: string; dark: boolean; children?: React.ReactNode }) {
  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className={cn("text-2xl font-bold", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h1>
        {sub && <p className={cn("text-sm mt-0.5", textSub)}>{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

export function ModSearchBar({ dark, placeholder = "Search…", value, onChange }: { dark: boolean; placeholder?: string; value: string; onChange: (v: string) => void }) {
  const inputCls = dark ? "bg-white/8 border-white/10 text-white placeholder:text-white/30" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E] placeholder:text-[#5A6E8E]/60";
  return (
    <div className="relative">
      <Search size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2", dark ? "text-white/40" : "text-[#5A6E8E]")} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cn("pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 transition-all w-64", inputCls)} />
    </div>
  );
}

export function ModSelect({ dark, options, value, onChange }: { dark: boolean; options: string[]; value: string; onChange: (v: string) => void }) {
  const inputCls = dark ? "bg-white/8 border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]";
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={cn("px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 transition-all", inputCls)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function ModBtn({ children, variant = "primary", onClick, icon: Icon, disabled = false }: { children: React.ReactNode; variant?: "primary" | "outline" | "ghost" | "danger"; onClick?: () => void; icon?: React.ElementType; disabled?: boolean }) {
  const base = "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[#0B3D91] text-white hover:bg-[#0a348a] shadow-md shadow-[#0B3D91]/20",
    outline: "border border-[#0B3D91]/15 text-[#0D1B3E] hover:bg-[#EEF2F8] bg-white",
    ghost: "text-[#3B82F6] hover:bg-blue-50",
    danger: "border border-red-200 text-red-600 hover:bg-red-50 bg-white",
  };
  return <button onClick={onClick} disabled={disabled} className={cn(base, variants[variant])}>{Icon && <Icon size={14} />}{children}</button>;
}

export function ModTable({ dark, headers, children, empty, totalCount = 0, page = 1, onPageChange }: { dark: boolean; headers: string[]; children: React.ReactNode; empty?: boolean; totalCount?: number; page?: number; onPageChange?: (p: number) => void }) {
  const thBg = dark ? "bg-white/8" : "bg-[#EEF2F8]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const borderCls = dark ? "border-white/8" : "border-[#0B3D91]/8";
  
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));

  return (
    <div className={cn("rounded-2xl border overflow-hidden", dark ? "border-white/10 bg-white/5" : "border-[#0B3D91]/8 bg-white shadow-sm")}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={thBg}>
              {headers.map(h => <th key={h} className={cn("px-4 py-3 text-left font-semibold whitespace-nowrap", textSub)}>{h}</th>)}
            </tr>
          </thead>
          <tbody className={cn("divide-y", dark ? "divide-white/5" : "divide-[#0B3D91]/5")}>
            {empty ? (
              <tr><td colSpan={headers.length} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText size={28} className={textSub} strokeWidth={1.5} />
                  <p className={cn("text-sm font-semibold", dark ? "text-white/60" : "text-[#5A6E8E]")}>No records found</p>
                </div>
              </td></tr>
            ) : children}
          </tbody>
        </table>
      </div>
      <div className={cn("flex items-center justify-between px-4 py-2.5 border-t", dark ? "border-white/8 bg-white/4" : "border-[#0B3D91]/8 bg-[#EEF2F8]")}>
        <span className={cn("text-[10px]", textSub)}>Showing {totalCount > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(totalCount, page * 10)} of {totalCount} results</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page === 1}
              className={cn(
                "px-2 h-6 rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                dark ? "text-white/50 hover:bg-white/10" : "text-[#5A6E8E] hover:bg-white"
              )}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange?.(p)}
                  className={cn(
                    "w-6 h-6 rounded-lg text-[10px] font-semibold transition-all cursor-pointer",
                    p === page ? "bg-[#0B3D91] text-white" : dark ? "text-white/50 hover:bg-white/10" : "text-[#5A6E8E] hover:bg-white"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={cn(
                "px-2 h-6 rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                dark ? "text-white/50 hover:bg-white/10" : "text-[#5A6E8E] hover:bg-white"
              )}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ModTd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 whitespace-nowrap", className)}>{children}</td>;
}

export function ModStatusBadge({ status }: { status: "active" | "inactive" | "archived" | "draft" | "scheduled" | "completed" | "open" | "closed" | "paused" }) {
  const map: Record<string, { v: "success" | "warning" | "error" | "info" | "default" | "privacy"; label: string }> = {
    active: { v: "success", label: "Active" }, open: { v: "success", label: "Open" },
    inactive: { v: "default", label: "Inactive" }, closed: { v: "error", label: "Closed" },
    archived: { v: "default", label: "Archived" }, completed: { v: "info", label: "Completed" },
    draft: { v: "warning", label: "Draft" }, scheduled: { v: "warning", label: "Scheduled" },
    paused: { v: "warning", label: "Paused" },
  };
  const { v, label } = map[status] ?? { v: "default", label: status };
  return <Badge variant={v}><StatusDot status={status === "active" || status === "open" ? "active" : status === "scheduled" || status === "draft" || status === "paused" ? "scheduled" : "closed"} />{label}</Badge>;
}

export function ActionsMenu() {
  return (
    <div className="flex items-center gap-1">
      <button className="p-1.5 rounded-lg text-[#3B82F6] hover:bg-blue-50 transition-colors cursor-pointer"><FileText size={13} /></button>
      <button className="p-1.5 rounded-lg text-[#5A6E8E] hover:bg-[#EEF2F8] transition-colors cursor-pointer"><RefreshCw size={13} /></button>
    </div>
  );
}
