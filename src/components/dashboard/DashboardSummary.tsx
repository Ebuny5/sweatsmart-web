
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from "recharts";
import { TrendData, ProcessedEpisode } from "@/types";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { useMemo } from "react";
import { normalizeEpisodeDates } from "@/lib/episodes";
import React from "react";

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
  
  const { processedWeeklyData, processedMonthlyData } = useMemo(() => {
    const safeEpisodes = normalizeEpisodeDates(allEpisodes || []);
    console.log('[dashboard] allEpisodes', allEpisodes.length, '-> safeEpisodes', safeEpisodes.length);

    // Generate chart data from episodes if provided data is empty
    const generateWeeklyData = () => {
      if (weeklyData.length > 0) return weeklyData;
      if (safeEpisodes.length === 0) return [];

      const episodesByWeek = new Map();
      
      safeEpisodes.forEach(episode => {
        try {
          if (!episode.datetime) {
            console.warn('Skipping episode with invalid datetime:', episode.id);
            return;
          }
          
          const weekStart = startOfWeek(episode.datetime);
          const weekKey = weekStart.getTime().toString();
          
          if (!episodesByWeek.has(weekKey)) {
            episodesByWeek.set(weekKey, { 
              episodes: [], 
              severities: [], 
              weekStart 
            });
          }
          
          const weekData = episodesByWeek.get(weekKey);
          weekData.episodes.push(episode);
          weekData.severities.push(episode.severityLevel);
        } catch (error) {
          console.error('Error processing episode for weekly data:', episode.id, error);
        }
      });

      return Array.from(episodesByWeek.entries())
        .map(([_, data]) => ({
          date: format(data.weekStart, 'MMM dd'),
          timestamp: data.weekStart.getTime(),
          episodeCount: data.episodes.length,
          averageSeverity: data.severities.length > 0 
            ? data.severities.reduce((a: number, b: number) => a + b, 0) / data.severities.length
            : 0
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    };

    const generateMonthlyData = () => {
      if (monthlyData.length > 0) return monthlyData;
      if (safeEpisodes.length === 0) return [];

      const episodesByMonth = new Map();
      
      safeEpisodes.forEach(episode => {
        try {
          if (!episode.datetime) {
            console.warn('Skipping episode with invalid datetime:', episode.id);
            return;
          }
          
          const monthStart = startOfMonth(episode.datetime);
          const monthKey = monthStart.getTime().toString();
          
          if (!episodesByMonth.has(monthKey)) {
            episodesByMonth.set(monthKey, { 
              episodes: [], 
              severities: [], 
              monthStart 
            });
          }
          
          const monthData = episodesByMonth.get(monthKey);
          monthData.episodes.push(episode);
          monthData.severities.push(episode.severityLevel);
        } catch (error) {
          console.error('Error processing episode for monthly data:', episode.id, error);
        }
      });

      return Array.from(episodesByMonth.entries())
        .map(([_, data]) => ({
          date: format(data.monthStart, 'MMM yyyy'),
          timestamp: data.monthStart.getTime(),
          episodeCount: data.episodes.length,
          averageSeverity: data.severities.length > 0
            ? data.severities.reduce((a: number, b: number) => a + b, 0) / data.severities.length
            : 0
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    };

    const weekly = generateWeeklyData();
    const monthly = generateMonthlyData();

    console.log('[dashboard] processedWeeklyData sample:', weekly.slice(0, 3));
    console.log('[dashboard] processedMonthlyData sample:', monthly.slice(0, 3));

    return {
      processedWeeklyData: weekly,
      processedMonthlyData: monthly
    };
  }, [weeklyData, monthlyData, allEpisodes]);

  const maxWeeklyEpisodes =
    processedWeeklyData.reduce(
      (max, point: any) => Math.max(max, point.episodeCount || 0),
      0
    ) || 1;

  const maxMonthlyEpisodes =
    processedMonthlyData.reduce(
      (max, point: any) => Math.max(max, point.episodeCount || 0),
      0
    ) || 1;

  const severityScaleMax = 5;

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-center p-8">
      <div className="space-y-2">
        <p className="font-medium">{message}</p>
        <p className="text-sm opacity-75">Start logging episodes to see your trends!</p>
      </div>
    </div>
  );

  return (
    <Card className="col-span-3 min-w-0">
      <CardHeader>
        <CardTitle>Trend Overview</CardTitle>
        {allEpisodes.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {allEpisodes.length} episodes tracked
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="frequency" className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="frequency" className="flex-1">Episode Frequency</TabsTrigger>
            <TabsTrigger value="severity" className="flex-1">Severity Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="frequency">
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                <div className="h-[300px] w-full">
                  {processedWeeklyData.length > 0 ? (
                    <div className="flex h-full items-end gap-4">
                      {processedWeeklyData.map((point: any) => {
                        const height =
                          ((point.episodeCount || 0) / maxWeeklyEpisodes) * 100;

                        return (
                          <div
                            key={point.timestamp || point.date}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="flex-1 flex items-end w-full rounded-t-lg bg-muted/60 overflow-hidden">
                              <div
                                className="w-full rounded-t-lg bg-primary transition-all"
                                style={{ height: `${Math.max(height, 8)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {point.date}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {point.episodeCount} episodes
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState message="No weekly data available yet" />
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="monthly">
                <div className="h-[300px] w-full">
                  {processedMonthlyData.length > 0 ? (
                    <div className="flex h-full items-end gap-4">
                      {processedMonthlyData.map((point: any) => {
                        const height =
                          ((point.episodeCount || 0) / maxMonthlyEpisodes) * 100;

                        return (
                          <div
                            key={point.timestamp || point.date}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="flex-1 flex items-end w-full rounded-t-lg bg-muted/60 overflow-hidden">
                              <div
                                className="w-full rounded-t-lg bg-primary transition-all"
                                style={{ height: `${Math.max(height, 8)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {point.date}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {point.episodeCount} episodes
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
                <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                <div className="h-[300px] w-full">
                  {processedWeeklyData.length >= 2 ? (
                    <div className="flex h-full items-end gap-4">
                      {processedWeeklyData.map((point: any) => {
                        const height =
                          ((point.averageSeverity || 0) / severityScaleMax) * 100;

                        return (
                          <div
                            key={point.timestamp || point.date}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="flex-1 flex items-end w-full rounded-t-lg bg-muted/60 overflow-hidden">
                              <div
                                className="w-full rounded-t-lg bg-primary/80 transition-all"
                                style={{ height: `${Math.max(height, 8)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {point.date}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Avg. severity {Number(point.averageSeverity || 0).toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState message="Need at least 2 weeks of data to show severity trends" />
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="monthly">
                <div className="h-[300px] w-full">
                  {processedMonthlyData.length >= 2 ? (
                    <div className="flex h-full items-end gap-4">
                      {processedMonthlyData.map((point: any) => {
                        const height =
                          ((point.averageSeverity || 0) / severityScaleMax) * 100;

                        return (
                          <div
                            key={point.timestamp || point.date}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="flex-1 flex items-end w-full rounded-t-lg bg-muted/60 overflow-hidden">
                              <div
                                className="w-full rounded-t-lg bg-primary/80 transition-all"
                                style={{ height: `${Math.max(height, 8)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {point.date}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Avg. severity {Number(point.averageSeverity || 0).toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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

export default React.memo(DashboardSummary);
