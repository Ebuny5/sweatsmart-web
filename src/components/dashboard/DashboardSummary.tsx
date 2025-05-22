
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
import { TrendData } from "@/types";

interface DashboardSummaryProps {
  weeklyData: TrendData[];
  monthlyData: TrendData[];
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  weeklyData,
  monthlyData,
}) => {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Trend Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="severity">
          <TabsList className="mb-4">
            <TabsTrigger value="severity">Severity Trends</TabsTrigger>
            <TabsTrigger value="frequency">Episode Frequency</TabsTrigger>
          </TabsList>
          <TabsContent value="severity">
            <Tabs defaultValue="weekly">
              <TabsList className="mb-4">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
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
                </div>
              </TabsContent>
              <TabsContent value="monthly">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
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
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="frequency">
            <Tabs defaultValue="weekly">
              <TabsList className="mb-4">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="episodeCount"
                        fill="hsl(var(--primary))"
                        name="Episodes"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="monthly">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="episodeCount"
                        fill="hsl(var(--primary))"
                        name="Episodes"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
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
