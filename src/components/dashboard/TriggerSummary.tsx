
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TriggerFrequency } from "@/types";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LabelList 
} from "recharts";

interface TriggerSummaryProps {
  triggers: TriggerFrequency[];
}

const TriggerSummary: React.FC<TriggerSummaryProps> = ({ triggers }) => {
  // Process the data for the chart
  const chartData = triggers.slice(0, 5).map(trigger => ({
    name: trigger.trigger.label,
    count: trigger.count,
    severity: trigger.averageSeverity
  }));
  
  return (
    <Card className="col-span-3 lg:col-span-2">
      <CardHeader>
        <CardTitle>Top Triggers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    return [value, name === 'count' ? 'Episodes' : 'Avg. Severity'];
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  name="Episodes" 
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList dataKey="count" position="right" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Not enough data to show trigger analysis
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TriggerSummary;
