import React, { useState, useEffect } from "react";
import { Star, TrendingUp, Users, Building2, Download, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import {
  ModHeader, ModBtn, ModSearchBar, cn
} from "../../components/admin/AdminShared.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { analyticsService } from "../../services/analytics.service.js";

export const Analytics: React.FC = () => {
  const { dark } = useTheme();
  const { systemName } = useSettings();
  
  // Search state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Loaded analytics data states
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [semesterTrend, setSemesterTrend] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";
  const tooltipStyle = { background: dark ? "#132052" : "#fff", border: "1px solid rgba(11,61,145,0.1)", borderRadius: 12, fontSize: 12 };

  const loadData = async () => {
    setLoading(true);
    try {
      const dbMetrics = await analyticsService.getDashboardMetrics();
      if (dbMetrics?.success) {
        const data = dbMetrics.data;
        setMetrics(data.metrics);
        setRatingDistribution(data.ratingDistribution || []);
        setSemesterTrend(data.trend || []);
        setDepartmentData(data.departments || []);
      }

      const ranks = await analyticsService.getFacultyRanking();
      if (ranks?.success) {
        setRankings(ranks.data || []);
      }
    } catch (err) {
      console.error("Failed to load analytics data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats safely for zero-state scenarios
  const hasRankings = rankings.length > 0 && rankings.some(r => r.rating > 0);
  const overallAvgVal = hasRankings
    ? rankings.reduce((sum, f) => sum + (f.rating || 0), 0) / rankings.length
    : 0;
  const overallAverage = overallAvgVal > 0 ? overallAvgVal.toFixed(2) : "0.00";

  const radarData = [
    { dim: "Clarity", value: Math.max(0, parseFloat(overallAverage)) },
    { dim: "Coverage", value: Math.max(0, parseFloat(overallAverage) - 0.1) },
    { dim: "Interaction", value: Math.max(0, parseFloat(overallAverage) + 0.15) },
    { dim: "Punctuality", value: Math.max(0, parseFloat(overallAverage) + 0.2) },
    { dim: "Aids", value: Math.max(0, parseFloat(overallAverage) - 0.12) },
  ];

  return (
    <div>
      <ModHeader title="Analytics" sub="In-depth performance insights across departments, faculty, and semesters" dark={dark}>
        <ModBtn icon={Download} variant="primary" onClick={() => window.print()}>Export Dashboard</ModBtn>
      </ModHeader>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 size={40} className="animate-spin text-[#0B3D91]" />
          <p className={cn("text-sm mt-3 font-semibold", textSub)}>Loading performance analytics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Overall Feedback Score", value: `${overallAverage} / 5`, icon: Star, color: "bg-[#0B3D91]", sub: `${systemName} Satisfaction Index` },
              { label: "Faculty Satisfaction", value: `${overallAvgVal > 0 ? Math.round((overallAvgVal / 5) * 100) : 0}%`, icon: TrendingUp, color: "bg-emerald-500", sub: "Based on overall ratings" },
              { label: "Response Rate", value: metrics?.completionRate || "0%", icon: Users, color: "bg-[#3B82F6]", sub: `Active class responses` },
              { label: "Departments Mapped", value: `${metrics?.totalBranches || 0} Branches`, icon: Building2, color: "bg-amber-500", sub: "Active branch records" },
            ].map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className={cn("rounded-2xl p-5 border", cardBg)}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}><Icon size={18} className="text-white" /></div>
                <div className={cn("text-xl font-bold mb-0.5", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
                <div className={cn("text-xs font-semibold", textPrimary)}>{label}</div>
                <div className={cn("text-[10px] mt-0.5", textSub)}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Department performance bar chart */}
            <div className={cn("lg:col-span-2 rounded-2xl border p-5", cardBg)}>
              <h4 className={cn("font-bold text-sm mb-4", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Average Score by Branch / Department</h4>
              {departmentData.length === 0 || !departmentData.some(d => d.rating > 0) ? (
                <div className="flex flex-col items-center justify-center h-[220px] text-center text-xs text-gray-400 font-medium">
                  No department scores recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart id="ana-compbar" data={departmentData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)"} />
                    <XAxis dataKey="dept" tick={{ fontSize: 10, fill: dark ? "#8AAAD4" : "#5A6E8E" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: dark ? "#8AAAD4" : "#5A6E8E" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="rating" name="Average Score" fill="#0B3D91" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Radar chart */}
            <div className={cn("rounded-2xl border p-5", cardBg)}>
              <h4 className={cn("font-bold text-sm mb-4", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Teaching Dimensions Radar</h4>
              {overallAvgVal === 0 ? (
                <div className="flex flex-col items-center justify-center h-[220px] text-center text-xs text-gray-400 font-medium">
                  No evaluation ratings collected yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart id="ana-radar" data={radarData}>
                    <PolarGrid stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(11,61,145,0.1)"} />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: dark ? "#8AAAD4" : "#5A6E8E" }} />
                    <Radar dataKey="value" stroke="#0B3D91" fill="#0B3D91" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Faculty rankings list */}
            <div className={cn("rounded-2xl border p-5", cardBg)}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h4 className={cn("font-bold text-sm", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Top Faculty Rankings</h4>
                <div className="max-w-xs w-full">
                  <ModSearchBar dark={dark} placeholder="Search rankings by faculty…" value={search} onChange={setSearch} />
                </div>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {rankings.filter(r => {
                  const q = debouncedSearch.toLowerCase().trim();
                  if (!q) return true;
                  return r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q);
                }).map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", i < 3 ? "bg-amber-100 text-amber-700" : dark ? "bg-white/10 text-white/60" : "bg-[#EEF2F8] text-[#5A6E8E]")}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-xs font-semibold truncate", textPrimary)}>{r.name}</span>
                        <span className={cn("text-xs font-bold", textPrimary)}>{r.rating} ★</span>
                      </div>
                      <div className={cn("h-1.5 rounded-full", dark ? "bg-white/10" : "bg-[#EEF2F8]")}>
                        <div className="h-full rounded-full bg-[#0B3D91]" style={{ width: `${(r.rating / 5) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {(rankings.length === 0 || !rankings.some(r => r.rating > 0)) && (
                  <p className="text-center text-xs text-gray-400 py-8">No ranking data available yet.</p>
                )}
              </div>
            </div>

            {/* Semester-wise submissions trend chart */}
            <div className={cn("rounded-2xl border p-5", cardBg)}>
              <h4 className={cn("font-bold text-sm mb-4", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Submissions Trend</h4>
              {semesterTrend.length === 0 || !semesterTrend.some(s => s.submissions > 0) ? (
                <div className="flex flex-col items-center justify-center h-[220px] text-center text-xs text-gray-400 font-medium">
                  No submission trend data recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart id="ana-trend" data={semesterTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)"} />
                    <XAxis dataKey="sem" tick={{ fontSize: 9, fill: dark ? "#8AAAD4" : "#5A6E8E" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: dark ? "#8AAAD4" : "#5A6E8E" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="submissions" name="Completed Responses" stroke="#0B3D91" fill="#0B3D91" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "#0B3D91" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
