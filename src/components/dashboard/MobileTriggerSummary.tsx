
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Calendar, Smartphone } from "lucide-react";
import { mobileNotificationService } from "@/services/MobileNotificationService";

interface Episode {
  id: string;
  triggers: any[];
  severity_level?: number;
  severity?: number;
  datetime?: string;
  date?: string;
}

interface MobileTriggerSummaryProps {
  episodes: Episode[];
}

const MobileTriggerSummary = ({ episodes }: MobileTriggerSummaryProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerCounts, setTriggerCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const isMobileApp = mobileNotificationService.isMobileApp();

  useEffect(() => {
    console.log('📊 MobileTriggerSummary: Component mounted');
    console.log('📊 MobileTriggerSummary: Episodes received:', episodes.length);
    console.log('📊 MobileTriggerSummary: Is mobile app:', isMobileApp);
    
    // Simulate loading to test mobile rendering
    setTimeout(() => {
      setIsVisible(true);
      setLoading(false);
      console.log('📊 MobileTriggerSummary: Component visible');
    }, 100);

    if (episodes.length > 0) {
      // Count triggers from recent episodes
      const recentEpisodes = episodes.slice(-30); // Last 30 episodes
      const counts: Record<string, number> = {};
      
      recentEpisodes.forEach(episode => {
        const triggers = episode.triggers || [];
        triggers.forEach((trigger: any) => {
          const label = typeof trigger === 'string' ? trigger : (trigger.label || trigger.value || 'Unknown');
          counts[label] = (counts[label] || 0) + 1;
        });
      });
      
      setTriggerCounts(counts);
      console.log('📊 MobileTriggerSummary: Trigger counts calculated:', counts);
    }
  }, [episodes, isMobileApp]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Trigger Summary
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isVisible) {
    console.log('📊 MobileTriggerSummary: Component not visible yet');
    return null;
  }

  const topTriggers = Object.entries(triggerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  console.log('📊 MobileTriggerSummary: Top triggers:', topTriggers);

  return (
    <Card className={isMobileApp ? "border-green-200" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Trigger Summary
          {isMobileApp && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topTriggers.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No triggers recorded yet</p>
            <p className="text-sm text-muted-foreground">Start logging episodes to see trigger patterns</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">
              Most frequent triggers from your recent episodes:
            </p>
            {topTriggers.map(([trigger, count], index) => (
              <div key={trigger} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-orange-500' :
                    index === 2 ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="font-medium">{trigger}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{count} times</Badge>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileTriggerSummary;
