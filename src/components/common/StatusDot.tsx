import React from "react";

export type StatusType = "active" | "scheduled" | "closed" | "online" | "offline";

interface StatusDotProps {
  status: StatusType;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status }) => {
  const colors = {
    active: "bg-emerald-500",
    scheduled: "bg-amber-400",
    closed: "bg-slate-400",
    online: "bg-emerald-500",
    offline: "bg-red-400"
  };

  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
};

export default StatusDot;
