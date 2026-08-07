import React, { useEffect, useState } from "react";
import { CheckCircle2, Lock, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { Badge } from "../../components/common/Badge.js";
import { studentService } from "../../services/student.service.js";

export const FeedbackHistory: React.FC = () => {
  const { dark } = useTheme();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await studentService.getHistory();
        if (res?.success) {
          setHistory(res.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const border = dark ? "border-white/8" : "border-[#0B3D91]/8";
  const cardBg = dark ? "bg-white/5" : "bg-white";
  const tableHeaderBg = dark ? "bg-white/4" : "bg-[#EEF2F8]";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#0B3D91]" />
        <p className="text-xs mt-3 font-medium text-[#5A6E8E]">Loading feedback submission history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`font-bold ${textPrimary} text-lg mb-1`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Feedback History</h2>
        <p className={`text-xs ${textSub}`}>Only submission status is displayed. Your individual responses are permanently anonymized and cannot be retrieved.</p>
      </div>

      <div className={`rounded-2xl border ${border} ${cardBg} shadow-sm overflow-x-auto`}>
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className={tableHeaderBg}>
              {["Subject", "Faculty", "Session", "Date", "Status"].map((h) => (
                <th key={h} className={`px-4 py-3 text-left font-semibold ${dark ? "text-blue-200/70" : "text-[#5A6E8E]"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={dark ? "divide-y divide-white/5" : "divide-y divide-[#0B3D91]/5"}>
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-xs font-semibold text-gray-400">
                  No feedback history found. You have not submitted any feedback responses yet.
                </td>
              </tr>
            ) : (
              history.map((row, i) => (
                <tr key={row.id || i} className={`hover:bg-black/2 dark:hover:bg-white/5 transition-colors`}>
                  <td className="px-4 py-3">
                    <div className={`font-semibold ${textPrimary}`}>{row.subject}</div>
                    <div className="text-[10px] text-[#5A6E8E] font-mono">{row.code}</div>
                  </td>
                  <td className={`px-4 py-3 ${textSub}`}>{row.faculty}</td>
                  <td className={`px-4 py-3 ${textSub}`}>{row.session}</td>
                  <td className={`px-4 py-3 ${textSub}`}>{row.date}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">
                      <CheckCircle2 size={10} /> Submitted
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs ${
        dark ? "bg-white/4 border-white/8 text-blue-200/50" : "bg-[#EEF2F8] border-[#0B3D91]/8 text-[#5A6E8E]"
      }`}>
        <Lock size={12} className="text-[#0B3D91] shrink-0" />
        Ratings and written responses are not displayed here. Only submission confirmation is stored — your responses remain permanently anonymous.
      </div>
    </div>
  );
};

export default FeedbackHistory;
