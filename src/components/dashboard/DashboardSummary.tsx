
import { useMemo } from "react";
import { format, startOfMonth, startOfWeek } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessedEpisode, TrendData } from "@/types";

interface DashboardSummaryProps {
  weeklyData: TrendData[];
  monthlyData: TrendData[];
  allEpisodes?: ProcessedEpisode[];
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  weeklyData,
  monthlyData,
  allEpisodes = [],
}) => {
  // 🔥 DEBUG: Log what we receive
  // eslint-disable-next-line no-console
  console.log("=== DashboardSummary Debug ===");
  // eslint-disable-next-line no-console
  console.log("Received allEpisodes:", allEpisodes.length);
  // eslint-disable-next-line no-console
  console.log("First episode:", allEpisodes[0]);
  if (allEpisodes[0]) {
    // eslint-disable-next-line no-console
    console.log("First episode datetime:", allEpisodes[0].datetime);
    // eslint-disable-next-line no-console
    console.log("datetime type:", typeof allEpisodes[0].datetime);
    // eslint-disable-next-line no-console
    console.log("Is Date?", allEpisodes[0].datetime instanceof Date);
  }

  const { processedWeeklyData, processedMonthlyData } = useMemo(() => {
    const generateWeeklyData = () => {
      // eslint-disable-next-line no-console
      console.log("🔍 Generating weekly data from", allEpisodes.length, "episodes");

      if (weeklyData.length > 0) {
        // eslint-disable-next-line no-console
        console.log("Using provided weeklyData:", weeklyData);
        return weeklyData;
      }
      if (allEpisodes.length === 0) {
        // eslint-disable-next-line no-console
        console.log("❌ No episodes to process");
        return [];
      }

      const episodesByWeek = new Map<string, { episodes: ProcessedEpisode[]; severities: number[] }>();

      allEpisodes.forEach((episode, idx) => {
        try {
          // eslint-disable-next-line no-console
          console.log(`Processing episode ${idx}:`, {
            datetime: episode.datetime,
            type: typeof episode.datetime,
            isDate: episode.datetime instanceof Date,
          });

          const weekStart = startOfWeek(episode.datetime);
          const weekKey = format(weekStart, "MMM dd");

          if (!episodesByWeek.has(weekKey)) {
            episodesByWeek.set(weekKey, { episodes: [], severities: [] });
          }

          const weekData = episodesByWeek.get(weekKey)!;
          weekData.episodes.push(episode);
          weekData.severities.push(episode.severityLevel);
        } catch (err) {
          console.error("❌ Error processing episode:", err, episode);
        }
      });

      const result = Array.from(episodesByWeek.entries())
        .map(([date, data]) => ({
          date,
          episodeCount: data.episodes.length,
          averageSeverity:
            data.severities.length > 0
              ? data.severities.reduce((a, b) => a + b, 0) / data.severities.length
              : 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // eslint-disable-next-line no-console
      console.log("✅ Generated weekly data:", result);
      return result;
    };

    const generateMonthlyData = () => {
      // eslint-disable-next-line no-console
      console.log("🔍 Generating monthly data");

      if (monthlyData.length > 0) return monthlyData;
      if (allEpisodes.length === 0) return [];

      const episodesByMonth = new Map<string, { episodes: ProcessedEpisode[]; severities: number[] }>();

      allEpisodes.forEach((episode) => {
        try {
          const monthStart = startOfMonth(episode.datetime);
          const monthKey = format(monthStart, "MMM yyyy");

          if (!episodesByMonth.has(monthKey)) {
            episodesByMonth.set(monthKey, { episodes: [], severities: [] });
          }

          const monthData = episodesByMonth.get(monthKey)!;
          monthData.episodes.push(episode);
          monthData.severities.push(episode.severityLevel);
        } catch (err) {
          console.error("Error processing episode for monthly data:", err);
        }
      });

      const result = Array.from(episodesByMonth.entries())
        .map(([date, data]) => ({
          date,
          episodeCount: data.episodes.length,
          averageSeverity:
            data.severities.length > 0
              ? data.severities.reduce((a, b) => a + b, 0) / data.severities.length
              : 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // eslint-disable-next-line no-console
      console.log("✅ Generated monthly data:", result);
      return result;
    };

    return {
      processedWeeklyData: generateWeeklyData(),
      processedMonthlyData: generateMonthlyData(),
    };
  }, [weeklyData, monthlyData, allEpisodes]);

  // eslint-disable-next-line no-console
  console.log("Final processedWeeklyData:", processedWeeklyData);
  // eslint-disable-next-line no-console
  console.log("Final processedMonthlyData:", processedMonthlyData);

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
      <div className="space-y-2">
        <p className="font-medium">{message}</p>
        <p className="text-sm opacity-75">Start logging episodes to see your trends!</p>
      </div>
    </div>
  );

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Trend Overview</CardTitle>
        {allEpisodes.length > 0 && (
          <p className="text-sm text-muted-foreground">{allEpisodes.length} episodes tracked</p>
        )}

      </CardHeader>

      <CardContent>
        <Tabs defaultValue="frequency" className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="frequency" className="flex-1">
              Episode Frequency
            </TabsTrigger>
            <TabsTrigger value="severity" className="flex-1">
              Severity Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frequency">
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="weekly" className="flex-1">
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1">
                  Monthly
                </TabsTrigger>
              </TabsList>

              <TabsContent value="weekly">
                <div className="h-[300px] w-full">
                  {processedWeeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processedWeeklyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(value: any) => [value, "Episodes"]}
                          labelFormatter={(label) => `Week of ${label}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Bar
                          dataKey="episodeCount"
                          fill="hsl(var(--primary))"
                          name="Episodes"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No weekly data available yet" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="monthly">
                <div className="h-[300px] w-full">
                  {processedMonthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processedMonthlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(value: any) => [value, "Episodes"]}
                          labelFormatter={(label) => `Month of ${label}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Bar
                          dataKey="episodeCount"
                          fill="hsl(var(--primary))"
                          name="Episodes"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No monthly data available yet" />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="severity">
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="weekly" className="flex-1">
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1">
                  Monthly
                </TabsTrigger>
              </TabsList>

              <TabsContent value="weekly">
                <div className="h-[300px] w-full">
                  {processedWeeklyData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={processedWeeklyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[1, 5]} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(value: any) => [Number(value).toFixed(1), "Average Severity"]}
                          labelFormatter={(label) => `Week of ${label}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="averageSeverity"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                          name="Average Severity"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Need at least 2 weeks of data to show severity trends" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="monthly">
                <div className="h-[300px] w-full">
                  {processedMonthlyData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={processedMonthlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[1, 5]} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(value: any) => [Number(value).toFixed(1), "Average Severity"]}
                          labelFormatter={(label) => `Month of ${label}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="averageSeverity"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                          name="Average Severity"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Need at least 2 months of data to show severity trends" />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardSummary;


