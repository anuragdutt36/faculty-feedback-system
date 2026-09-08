import React, { useState, useEffect } from "react";
import { TrendingUp, Calendar, ShieldCheck, BarChart3, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { apiFetch } from "../../services/api.js";

interface TrendItem {
  period: string;
  score: number;
  responses: number;
}

export const FeedbackTrends: React.FC = () => {
  const { user } = useAuth();
  const isDean = user?.role === "dean";

  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await apiFetch("/analytics/dashboard");
        if (data?.success && Array.isArray(data.data?.trend)) {
          const mapped = data.data.trend.map((t: any) => ({
            period: t.sem || "Session",
            score: (t.ratingScaled || 0) / 20, // scale from 100 to 5.0
            responses: t.submissions || 0
          }));
          if (mapped.length > 0) setTrends(mapped);
        }
      } catch (err) {
        console.error("Failed to load feedback trends:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Feedback &amp; Performance Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/70 mt-1">
            {isDean
              ? "Multi-semester historical trends across all academic departments."
              : `Multi-semester historical trends for ${user?.department || "your department"}.`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-100 dark:border-purple-500/20">
          <TrendingUp size={16} />
          <span>Longitudinal Analysis</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={18} className="text-[#0B3D91]" />
          <span>Academic Session Feedback Progression</span>
        </h2>

        <div className="space-y-4">
          {trends.map((t) => (
            <div
              key={t.period}
              className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2"
            >
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-900 dark:text-white font-bold">{t.period}</span>
                <span className="text-[#0B3D91] dark:text-blue-400 font-extrabold">
                  {t.score.toFixed(1)} / 5.0 ({t.responses} Responses)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-[#0B3D91] h-full rounded-full transition-all duration-500"
                  style={{ width: `${(t.score / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackTrends;
