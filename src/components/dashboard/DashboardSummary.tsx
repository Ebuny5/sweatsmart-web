
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
import { useMemo, useState, useTransition } from "react";
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
  const [mainTab, setMainTab] = useState("frequency");
  const [freqPeriod, setFreqPeriod] = useState("weekly");
  const [sevPeriod, setSevPeriod] = useState("weekly");
  const [isPending, startTransition] = useTransition();
  
  const { processedWeeklyData, processedMonthlyData } = useMemo(() => {
    const needEpisodes = weeklyData.length === 0 || monthlyData.length === 0;
    const safeEpisodes = needEpisodes ? normalizeEpisodeDates(allEpisodes || []) : [];
    
    if (needEpisodes) {
      console.log('[dashboard] allEpisodes', allEpisodes.length, '-> safeEpisodes', safeEpisodes.length);
    }

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
        <Tabs value={mainTab} onValueChange={(v) => startTransition(() => setMainTab(v))} className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="frequency" className="flex-1">Episode Frequency</TabsTrigger>
            <TabsTrigger value="severity" className="flex-1">Severity Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="frequency">
            <Tabs value={freqPeriod} onValueChange={(v) => startTransition(() => setFreqPeriod(v))} className="w-full">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                <div className="h-[300px] w-full">
                  {processedWeeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedWeeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: 'Episodes', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar 
                          dataKey="episodeCount" 
                          fill="hsl(var(--primary))" 
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
                      <BarChart data={processedMonthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: 'Episodes', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar 
                          dataKey="episodeCount" 
                          fill="hsl(var(--primary))" 
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
            <Tabs value={sevPeriod} onValueChange={(v) => startTransition(() => setSevPeriod(v))} className="w-full">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                <div className="h-[300px] w-full">
                  {processedWeeklyData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedWeeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 5]}
                          label={{ value: 'Avg Severity', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any) => [Number(value).toFixed(1), 'Avg Severity']}
                        />
                        <Line 
                          type="monotone"
                          dataKey="averageSeverity" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
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
                      <LineChart data={processedMonthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 5]}
                          label={{ value: 'Avg Severity', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any) => [Number(value).toFixed(1), 'Avg Severity']}
                        />
                        <Line 
                          type="monotone"
                          dataKey="averageSeverity" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
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

export default React.memo(DashboardSummary);
