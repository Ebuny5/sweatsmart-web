
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TriggerFrequency, Episode } from "@/types";
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
  allEpisodes?: Episode[];
}

const TriggerSummary: React.FC<TriggerSummaryProps> = ({ triggers, allEpisodes = [] }) => {
  // Generate trigger data from episodes if triggers array is empty
  const generateTriggerData = () => {
    if (triggers.length > 0) return triggers;
    if (allEpisodes.length === 0) return [];

    const triggerCounts = new Map();
    const triggerSeverities = new Map();
    
    allEpisodes.forEach(episode => {
      episode.triggers.forEach(trigger => {
        const triggerKey = trigger.label || trigger.value || 'Unknown';
        
        if (!triggerCounts.has(triggerKey)) {
          triggerCounts.set(triggerKey, 0);
          triggerSeverities.set(triggerKey, []);
        }
        
        triggerCounts.set(triggerKey, triggerCounts.get(triggerKey) + 1);
        triggerSeverities.get(triggerKey).push(episode.severityLevel);
      });
    });

    return Array.from(triggerCounts.entries()).map(([triggerLabel, count]) => {
      const severities = triggerSeverities.get(triggerLabel);
      const averageSeverity = severities.reduce((a: number, b: number) => a + b, 0) / severities.length;
      
      return {
        trigger: { label: triggerLabel, type: 'environmental', value: triggerLabel },
        count,
        averageSeverity
      };
    });
  };

  const processedTriggers = generateTriggerData();
  const isInsightState = allEpisodes.length >= 10;
  
  // Show top 5 in insight state, all in summary state
  const displayTriggers = isInsightState 
    ? processedTriggers.slice(0, 5)
    : processedTriggers;

  const chartData = displayTriggers.map(trigger => ({
    name: trigger.trigger.label.length > 15 
      ? trigger.trigger.label.substring(0, 15) + '...' 
      : trigger.trigger.label,
    fullName: trigger.trigger.label,
    count: trigger.count,
    severity: trigger.averageSeverity
  }));

  const cardTitle = isInsightState ? "Your Top Triggers" : "Trigger Summary";
  
  return (
    <Card className="col-span-3 lg:col-span-2">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        {allEpisodes.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {processedTriggers.length} triggers identified
          </p>
        )}
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
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || label;
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
            <div className="flex items-center justify-center h-full text-muted-foreground text-center">
              <div className="space-y-2">
                <p>No triggers logged yet</p>
                <p className="text-sm">Start tracking episodes with triggers to see patterns!</p>
              </div>
            </div>
          )}
        </div>
        
        {!isInsightState && chartData.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Keep tracking!</strong> Log {10 - allEpisodes.length} more episodes to unlock deeper insights into your top triggers.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TriggerSummary;
