
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
import { format, startOfWeek, startOfMonth, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";

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
  // Generate chart data from episodes if weeklyData/monthlyData are empty
  const generateWeeklyData = () => {
    if (weeklyData.length > 0) return weeklyData;
    if (allEpisodes.length === 0) return [];

    const episodesByWeek = new Map();
    
    allEpisodes.forEach(episode => {
      const weekStart = startOfWeek(episode.datetime);
      const weekKey = format(weekStart, 'MMM dd');
      
      if (!episodesByWeek.has(weekKey)) {
        episodesByWeek.set(weekKey, { episodes: [], severities: [] });
      }
      
      episodesByWeek.get(weekKey).episodes.push(episode);
      episodesByWeek.get(weekKey).severities.push(episode.severityLevel);
    });

    return Array.from(episodesByWeek.entries()).map(([date, data]) => ({
      date,
      episodeCount: data.episodes.length,
      averageSeverity: data.severities.reduce((a, b) => a + b, 0) / data.severities.length
    }));
  };

  const generateMonthlyData = () => {
    if (monthlyData.length > 0) return monthlyData;
    if (allEpisodes.length === 0) return [];

    const episodesByMonth = new Map();
    
    allEpisodes.forEach(episode => {
      const monthStart = startOfMonth(episode.datetime);
      const monthKey = format(monthStart, 'MMM yyyy');
      
      if (!episodesByMonth.has(monthKey)) {
        episodesByMonth.set(monthKey, { episodes: [], severities: [] });
      }
      
      episodesByMonth.get(monthKey).episodes.push(episode);
      episodesByMonth.get(monthKey).severities.push(episode.severityLevel);
    });

    return Array.from(episodesByMonth.entries()).map(([date, data]) => ({
      date,
      episodeCount: data.episodes.length,
      averageSeverity: data.severities.reduce((a, b) => a + b, 0) / data.severities.length
    }));
  };

  const processedWeeklyData = generateWeeklyData();
  const processedMonthlyData = generateMonthlyData();

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-center p-8">
      <div className="space-y-2">
        <p>{message}</p>
        <p className="text-sm">Start logging episodes to see your trends!</p>
      </div>
    </div>
  );

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Trend Overview</CardTitle>
        {allEpisodes.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {allEpisodes.length} episodes tracked
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="frequency">
          <TabsList className="mb-4">
            <TabsTrigger value="frequency">Episode Frequency</TabsTrigger>
            <TabsTrigger value="severity">Severity Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="frequency">
            <Tabs defaultValue="weekly">
              <TabsList className="mb-4">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly">
                <div className="h-[300px]">
                  {processedWeeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedWeeklyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [value, "Episodes"]}
                          labelFormatter={(label) => `Week of ${label}`}
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
                <div className="h-[300px]">
                  {processedMonthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedMonthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [value, "Episodes"]}
                          labelFormatter={(label) => `Month of ${label}`}
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
            <Tabs defaultValue="weekly">
              <TabsList className="mb-4">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly">
                <div className="h-[300px]">
                  {processedWeeklyData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedWeeklyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[1, 5]} />
                        <Tooltip 
                          formatter={(value) => [Number(value).toFixed(1), "Average Severity"]}
                          labelFormatter={(label) => `Week of ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="averageSeverity"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
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
                <div className="h-[300px]">
                  {processedMonthlyData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedMonthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[1, 5]} />
                        <Tooltip 
                          formatter={(value) => [Number(value).toFixed(1), "Average Severity"]}
                          labelFormatter={(label) => `Month of ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="averageSeverity"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
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
