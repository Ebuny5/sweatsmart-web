
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TriggerFrequency, ProcessedEpisode } from "@/types";
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
import { useMemo } from "react";
import { Eye, BarChart3 } from "lucide-react";

interface TriggerSummaryProps {
  triggers: TriggerFrequency[];
  allEpisodes?: ProcessedEpisode[];
}

const TriggerSummary: React.FC<TriggerSummaryProps> = ({ triggers, allEpisodes = [] }) => {
  
  const processedTriggers = useMemo(() => {
    // Use provided triggers if available, otherwise generate from episodes
    if (triggers.length > 0) return triggers;
    if (allEpisodes.length === 0) return [];

    const triggerCounts = new Map<string, { count: number; severities: number[] }>();
    
    allEpisodes.forEach(episode => {
      episode.triggers.forEach(trigger => {
        const key = trigger.label || trigger.value || 'Unknown';
        const existing = triggerCounts.get(key) || { count: 0, severities: [] };
        existing.count += 1;
        existing.severities.push(episode.severityLevel);
        triggerCounts.set(key, existing);
      });
    });

    return Array.from(triggerCounts.entries()).map(([label, data]) => {
      const averageSeverity = data.severities.length > 0
        ? data.severities.reduce((a, b) => a + b, 0) / data.severities.length
        : 0;
      
      return {
        trigger: { 
          label, 
          type: 'environmental' as const, 
          value: label 
        },
        count: data.count,
        averageSeverity,
        percentage: allEpisodes.length > 0 ? Math.round((data.count / allEpisodes.length) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [triggers, allEpisodes]);

  const isInsightState = allEpisodes.length >= 10;
  
  // Show top 5 in insight state, all in summary state
  const displayTriggers = isInsightState 
    ? processedTriggers.slice(0, 5)
    : processedTriggers;

  const chartData = useMemo(() => {
    return displayTriggers.map(triggerFreq => {
      // Handle both formats: { trigger: { label } } and { name }
      const triggerLabel = triggerFreq.trigger?.label || 
                          triggerFreq.trigger?.value || 
                          triggerFreq.name ||
                          'Unknown';
      return {
        name: triggerLabel.length > 12 
          ? triggerLabel.substring(0, 12) + '...' 
          : triggerLabel,
        fullName: triggerLabel,
        count: triggerFreq.count,
        severity: Number((triggerFreq.averageSeverity ?? 0).toFixed(1)),
        percentage: triggerFreq.percentage ?? 0
      };
    });
  }, [displayTriggers]);

  const cardTitle = isInsightState ? "Your Top Triggers" : "Trigger Summary";

  const handleTriggerClick = (triggerName: string) => {
    // Navigate to episodes filtered by this trigger
    const filteredEpisodes = allEpisodes.filter(episode => 
      episode.triggers.some(trigger => 
        (trigger.label || trigger.value || 'Unknown') === triggerName
      )
    );
    
    console.log(`Clicked on trigger: ${triggerName}`, filteredEpisodes);
    // TODO: Implement navigation to filtered episodes view
  };
  
  return (
    <Card className="col-span-3 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {cardTitle}
            </CardTitle>
            {allEpisodes.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {processedTriggers.length} unique triggers identified from {allEpisodes.length} episodes
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            Total Episodes: {allEpisodes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 60, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis 
                  type="number" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={95}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    return [value, name === 'count' ? 'Episodes' : 'Avg. Severity'];
                  }}
                  labelFormatter={(label: string, payload: any[]) => {
                    const item = payload?.[0]?.payload;
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{item?.fullName || label}</div>
                        <div className="text-xs text-muted-foreground">
                          {item?.percentage}% of all episodes
                        </div>
                      </div>
                    );
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  name="Episodes" 
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(data) => handleTriggerClick(data.fullName)}
                >
                  <LabelList 
                    dataKey="count" 
                    position="right" 
                    fontSize={11}
                    fill="hsl(var(--foreground))"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-center">
              <div className="space-y-3">
                <div className="text-4xl opacity-50">📊</div>
                <p className="font-medium">No triggers logged yet</p>
                <p className="text-sm opacity-75">Start tracking episodes with triggers to see patterns!</p>
              </div>
            </div>
          )}
        </div>
        
        {chartData.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {displayTriggers.slice(0, 3).map((trigger, index) => {
                const buttonLabel = trigger.trigger?.label || trigger.name || 'Unknown';
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleTriggerClick(buttonLabel)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {buttonLabel} ({trigger.count})
                  </Button>
                );
              })}
            </div>
            
            {!isInsightState && chartData.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg border border-muted">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Keep tracking!</strong> Log {10 - allEpisodes.length} more episodes to unlock deeper insights and trigger analysis.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TriggerSummary;

