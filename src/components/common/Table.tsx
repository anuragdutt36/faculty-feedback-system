import React, { useState, useEffect, useRef } from "react";
import { MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "./Badge.js";
import { StatusDot } from "./StatusDot.js";

interface TableProps {
  dark: boolean;
  headers: string[];
  children: React.ReactNode;
  empty?: boolean;
}

export const Table: React.FC<TableProps> = ({
  dark,
  headers,
  children,
  empty = false,
}) => {
  const border = dark ? "border-white/8" : "border-[#0B3D91]/8";
  const headerBg = dark ? "bg-white/4" : "bg-[#F8FAFD]";
  const headerText = dark ? "text-blue-200/50" : "text-[#5A6E8E]/80";

  return (
    <div className={`overflow-x-auto rounded-2xl border ${border} bg-transparent`}>
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className={`border-b ${border} ${headerBg}`}>
            {headers.map((h, i) => (
              <th key={i} className={`px-5 py-3.5 font-semibold uppercase tracking-wider ${headerText}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={dark ? "divide-y divide-white/5" : "divide-y divide-[#0B3D91]/5"}>
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="px-5 py-8 text-center text-[#5A6E8E] italic">
                No records found.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

interface TdProps {
  children: React.ReactNode;
  className?: string;
}

export const Td: React.FC<TdProps> = ({ children, className = "" }) => {
  return (
    <td className={`px-5 py-3.5 align-middle whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
};

interface TableStatusBadgeProps {
  status: "active" | "inactive" | "archived" | "draft" | "scheduled" | "completed" | "open" | "closed" | "paused";
}

export const TableStatusBadge: React.FC<TableStatusBadgeProps> = ({ status }) => {
  const statusMappings: Record<string, { variant: "success" | "warning" | "error" | "default" | "info" | "privacy"; text: string; dot: "active" | "scheduled" | "closed" | "online" | "offline" }> = {
    active: { variant: "success", text: "Active", dot: "active" },
    inactive: { variant: "error", text: "Inactive", dot: "closed" },
    archived: { variant: "default", text: "Archived", dot: "closed" },
    draft: { variant: "info", text: "Draft", dot: "scheduled" },
    scheduled: { variant: "warning", text: "Scheduled", dot: "scheduled" },
    completed: { variant: "success", text: "Completed", dot: "active" },
    open: { variant: "success", text: "Open", dot: "active" },
    closed: { variant: "error", text: "Closed", dot: "closed" },
    paused: { variant: "warning", text: "Paused", dot: "scheduled" },
  };

  const map = statusMappings[status] || { variant: "default", text: status, dot: "closed" };

  return (
    <Badge variant={map.variant}>
      <StatusDot status={map.dot} /> {map.text}
    </Badge>
  );
};

export const ActionsMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-[#5A6E8E] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-24 rounded-xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#132052] shadow-lg py-1 z-40 flex items-center justify-around">
          <button className="p-1.5 rounded-lg text-[#5A6E8E] hover:bg-[#EEF2F8] dark:hover:bg-white/8 transition-colors cursor-pointer">
            <RefreshCw size={13} />
          </button>
          <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
