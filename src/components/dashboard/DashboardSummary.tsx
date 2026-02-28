import { useMemo, useState } from "react";
import { format, startOfWeek, startOfMonth } from "date-fns";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area,
} from "recharts";
import { ProcessedEpisode, TrendData } from "@/types";
import { Sparkles } from "lucide-react";

interface DashboardSummaryProps {
  weeklyData: TrendData[];
  monthlyData: TrendData[];
  allEpisodes?: ProcessedEpisode[];
}

type Timeframe = "D" | "W" | "M" | "Y";

const TIMEFRAME_CONFIG: Record<Timeframe, {
  label: string;
  bucketFn: (d: Date) => string;
  maxPoints: number;
  tooltipLabel: string;
}> = {
  D: { label: "Day",   bucketFn: (d) => format(d, "EEE d"),              maxPoints: 14, tooltipLabel: "Day"   },
  W: { label: "Week",  bucketFn: (d) => format(startOfWeek(d), "MMM d"), maxPoints: 12, tooltipLabel: "Week"  },
  M: { label: "Month", bucketFn: (d) => format(startOfMonth(d), "MMM yy"), maxPoints: 12, tooltipLabel: "Month" },
  Y: { label: "Year",  bucketFn: (d) => format(d, "yyyy"),               maxPoints: 6,  tooltipLabel: "Year"  },
};

const DualTooltip = ({ active, payload, label, timeframe }: any) => {
  if (!active || !payload?.length) return null;
  const freq = payload.find((p: any) => p.dataKey === "count");
  const sev  = payload.find((p: any) => p.dataKey === "severity");
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 px-4 py-3 text-xs min-w-[150px]">
      <p className="font-bold text-gray-500 mb-2">{TIMEFRAME_CONFIG[timeframe as Timeframe]?.tooltipLabel}: {label}</p>
      {freq && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-400" />
          <span className="text-gray-700"><strong className="text-violet-700">{freq.value}</strong> episode{freq.value !== 1 ? "s" : ""}</span>
        </div>
      )}
      {sev && sev.value > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
          <span className="text-gray-700">
            HDSS avg <strong className={sev.value >= 3 ? "text-amber-600" : "text-sky-600"}>{Number(sev.value).toFixed(1)}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

const generateInsight = (data: any[], tf: Timeframe, total: number): string => {
  if (!data || data.length < 2)
    return `${total} episodes logged. Keep tracking — Hyper AI needs at least 2 ${TIMEFRAME_CONFIG[tf].label.toLowerCase()} data points to identify patterns.`;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const freqDiff = last.count - prev.count;
  const sevDiff  = (last.severity && prev.severity) ? last.severity - prev.severity : null;
  const timeLabel: Record<Timeframe, string> = {
    D: "today vs yesterday", W: "this week vs last week",
    M: "this month vs last month", Y: "this year vs last year",
  };
  if (freqDiff < 0)
    return `🎉 Hyper AI: ${Math.abs(freqDiff)} fewer episode${Math.abs(freqDiff) !== 1 ? "s" : ""} ${timeLabel[tf]}. ${sevDiff && sevDiff < 0 ? `Severity also dropped by ${Math.abs(sevDiff).toFixed(1)} HDSS — excellent progress!` : "Keep going, warrior!"}`;
  if (freqDiff > 0)
    return `📈 Hyper AI: Episodes up by ${freqDiff} ${timeLabel[tf]}. Review environmental & emotional triggers — heat and crowded spaces are your most common culprits.`;
  const validSev = data.filter(d => d.severity > 0);
  const avgSev = validSev.length ? validSev.reduce((s, d) => s + d.severity, 0) / validSev.length : 0;
  if (avgSev >= 3)
    return `⚠️ Hyper AI: Average HDSS ${avgSev.toFixed(1)} means episodes are frequently interfering with daily life. Clinical-strength antiperspirants or iontophoresis may be worth discussing with your dermatologist.`;
  return `➡️ Hyper AI: Pattern is stable in this ${TIMEFRAME_CONFIG[tf].label.toLowerCase()} view. ${total} total episodes tracked — deeper correlations will emerge as your dataset grows.`;
};

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ allEpisodes = [] }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>("W");

  const chartData = useMemo(() => {
    if (!allEpisodes.length) return [];
    const cfg = TIMEFRAME_CONFIG[timeframe];
    const bucketMap = new Map<string, { count: number; severities: number[] }>();
    allEpisodes.forEach(ep => {
      try {
        const key = cfg.bucketFn(new Date(ep.datetime));
        const b = bucketMap.get(key) || { count: 0, severities: [] };
        b.count++;
        b.severities.push(ep.severityLevel);
        bucketMap.set(key, b);
      } catch {}
    });
    return Array.from(bucketMap.entries())
      .map(([date, d]) => ({
        date,
        count: d.count,
        severity: d.severities.length
          ? parseFloat((d.severities.reduce((a, b) => a + b, 0) / d.severities.length).toFixed(2))
          : 0,
      }))
      .sort((a, b) => { try { return new Date(a.date).getTime() - new Date(b.date).getTime(); } catch { return 0; } })
      .slice(-cfg.maxPoints);
  }, [allEpisodes, timeframe]);

  const aiInsight = useMemo(() => generateInsight(chartData, timeframe, allEpisodes.length), [chartData, timeframe, allEpisodes.length]);
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  if (!allEpisodes.length) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 min-h-[180px]">
        <span className="text-4xl opacity-25">📊</span>
        <p className="text-sm font-semibold text-gray-400 text-center">Log your first episode to see your trend chart here</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">

      {/* D / W / M / Y picker */}
      <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
        {(["D", "W", "M", "Y"] as Timeframe[]).map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`flex-1 py-2.5 rounded-xl transition-all font-black text-xs ${
              timeframe === tf
                ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg shadow-purple-200 scale-105"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tf}
            <span className="block text-[9px] font-normal opacity-70 leading-tight mt-0.5">{TIMEFRAME_CONFIG[tf].label}</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-400" />
          <span className="text-[11px] text-gray-500 font-medium">Episode count</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-pink-500 rounded-full" />
          <span className="text-[11px] text-gray-500 font-medium">HDSS severity (1–4)</span>
        </div>
      </div>

      {/* Combo chart */}
      <div className="h-[230px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#ede9fe" strokeOpacity={0.7} />
              <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false}
                tick={{ fill: "#9ca3af", fontWeight: 600 }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" orientation="left" fontSize={9} tickLine={false} axisLine={false}
                tick={{ fill: "#a78bfa" }} allowDecimals={false} domain={[0, Math.ceil(maxCount * 1.3)]} />
              <YAxis yAxisId="right" orientation="right" fontSize={9} tickLine={false} axisLine={false}
                domain={[1, 4]} ticks={[1, 2, 3, 4]} tick={{ fill: "#f472b6" }} />
              <Tooltip content={<DualTooltip timeframe={timeframe} />} />
              <Bar yAxisId="left" dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} name="Episodes" />
              <Area yAxisId="right" type="monotone" dataKey="severity" stroke="none" fill="url(#areaGrad)" connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="severity" stroke="#ec4899" strokeWidth={2.5}
                dot={{ fill: "#ec4899", strokeWidth: 2, r: 4, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
                connectNulls name="HDSS Severity" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-3xl opacity-25">📊</span>
            <p className="text-xs text-gray-400 font-medium">No data in this range — try a wider timeframe</p>
          </div>
        )}
      </div>

      {/* HDSS reference */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {[
          { level: 1, label: "Never noticeable", cls: "bg-sky-50 text-sky-700 border-sky-200" },
          { level: 2, label: "Tolerable",         cls: "bg-blue-50 text-blue-700 border-blue-200" },
          { level: 3, label: "Barely tolerable",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
          { level: 4, label: "Intolerable",       cls: "bg-red-50 text-red-700 border-red-200" },
        ].map(h => (
          <div key={h.level} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold shrink-0 ${h.cls}`}>
            <span className="font-black">HDSS {h.level}</span>
            <span className="opacity-60">— {h.label}</span>
          </div>
        ))}
      </div>

      {/* Hyper AI insight card */}
      <div className="rounded-2xl bg-[#f5f4f7] border border-purple-100 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">
            Hyper AI · {TIMEFRAME_CONFIG[timeframe].label} Analysis
          </p>
          <p className="text-xs text-gray-700 leading-relaxed">{aiInsight}</p>
        </div>
      </div>

    </div>
  );
};

export default DashboardSummary;
