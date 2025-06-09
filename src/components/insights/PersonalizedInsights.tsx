
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TriggerFrequency, BodyAreaFrequency } from "@/types";
import { Lightbulb, TrendingUp, Target, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PersonalizedInsightsProps {
  episodes: any[];
}

const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({ episodes }) => {
  const [topTriggers, setTopTriggers] = useState<TriggerFrequency[]>([]);
  const [topBodyAreas, setTopBodyAreas] = useState<BodyAreaFrequency[]>([]);

  useEffect(() => {
    if (episodes.length === 0) return;

    // Calculate trigger frequencies
    const triggerCounts: { [key: string]: { count: number; totalSeverity: number; trigger: any } } = {};
    
    episodes.forEach(episode => {
      if (episode.triggers && Array.isArray(episode.triggers)) {
        episode.triggers.forEach((trigger: any) => {
          const triggerKey = typeof trigger === 'string' ? trigger : (trigger.label || trigger.value || 'Unknown');
          if (!triggerCounts[triggerKey]) {
            triggerCounts[triggerKey] = { count: 0, totalSeverity: 0, trigger };
          }
          triggerCounts[triggerKey].count++;
          triggerCounts[triggerKey].totalSeverity += episode.severity || 0;
        });
      }
    });

    const triggerFreqs = Object.entries(triggerCounts)
      .map(([key, data]) => ({
        trigger: data.trigger,
        count: data.count,
        averageSeverity: data.totalSeverity / data.count,
        percentage: Math.round((data.count / episodes.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Calculate body area frequencies
    const bodyAreaCounts: { [key: string]: { count: number; totalSeverity: number } } = {};
    
    episodes.forEach(episode => {
      if (episode.body_areas && Array.isArray(episode.body_areas)) {
        episode.body_areas.forEach((area: string) => {
          if (!bodyAreaCounts[area]) {
            bodyAreaCounts[area] = { count: 0, totalSeverity: 0 };
          }
          bodyAreaCounts[area].count++;
          bodyAreaCounts[area].totalSeverity += episode.severity || 0;
        });
      }
    });

    const bodyAreaFreqs = Object.entries(bodyAreaCounts)
      .map(([area, data]) => ({
        area,
        count: data.count,
        averageSeverity: data.totalSeverity / data.count,
        percentage: Math.round((data.count / episodes.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    setTopTriggers(triggerFreqs);
    setTopBodyAreas(bodyAreaFreqs);
  }, [episodes]);

  const getPersonalizedInsightCard = (trigger: TriggerFrequency) => {
    const triggerType = typeof trigger.trigger === 'object' ? trigger.trigger.type : 'general';
    const triggerLabel = typeof trigger.trigger === 'object' ? trigger.trigger.label : trigger.trigger;
    
    let insight = "";
    let actionableTip = "";
    
    if (triggerType === 'emotional') {
      insight = `Stress and emotional factors appear in ${trigger.percentage}% of your episodes with an average severity of ${trigger.averageSeverity.toFixed(1)}.`;
      actionableTip = "Consider incorporating a 5-minute breathing exercise or mindfulness practice into your daily routine to help manage stress levels.";
    } else if (triggerType === 'environmental' && triggerLabel.toLowerCase().includes('temperature')) {
      insight = `Temperature-related triggers appear in ${trigger.percentage}% of your episodes.`;
      actionableTip = "Try dressing in layers and keeping cooling accessories like a portable fan or cooling towel handy for temperature management.";
    } else if (triggerType === 'dietary') {
      insight = `Dietary triggers appear in ${trigger.percentage}% of your episodes.`;
      actionableTip = "Consider keeping a food diary to identify specific foods that may trigger episodes, and plan your meals accordingly before important events.";
    } else {
      insight = `Your primary trigger "${triggerLabel}" appears in ${trigger.percentage}% of your logged episodes.`;
      actionableTip = "Tracking this pattern can help you prepare better strategies for managing situations involving this trigger.";
    }

    return { insight, actionableTip };
  };

  const getBodyAreaInsightCard = (bodyArea: BodyAreaFrequency) => {
    let insight = `${bodyArea.area.charAt(0).toUpperCase() + bodyArea.area.slice(1)} sweating occurs in ${bodyArea.percentage}% of your episodes.`;
    let actionableTip = "";
    
    if (bodyArea.area === 'palms') {
      actionableTip = "Keep your hands cool and dry by using antiperspirant lotions designed for hands, and consider carrying a small towel for quick moisture management.";
    } else if (bodyArea.area === 'armpits') {
      actionableTip = "Apply antiperspirant at night for better effectiveness, and choose breathable, moisture-wicking fabrics for your clothing.";
    } else if (bodyArea.area === 'face') {
      actionableTip = "Use oil-free, non-comedogenic skincare products and keep cooling facial wipes handy for emergency situations.";
    } else {
      actionableTip = "Focus on keeping this area cool and dry with appropriate clothing choices and cooling strategies.";
    }

    return { insight, actionableTip };
  };

  if (episodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {topTriggers.map((trigger, index) => {
          const { insight, actionableTip } = getPersonalizedInsightCard(trigger);
          
          return (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Primary Trigger Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">THE INSIGHT</h4>
                  <p className="text-sm">{insight}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">ACTIONABLE TIP</h4>
                  <p className="text-sm bg-green-50 p-3 rounded-lg border-l-4 border-l-green-500">
                    {actionableTip}
                  </p>
                </div>
                
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Explore Treatment Options
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {topBodyAreas.map((bodyArea, index) => {
          const { insight, actionableTip } = getBodyAreaInsightCard(bodyArea);
          
          return (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Body Area Pattern
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">THE INSIGHT</h4>
                  <p className="text-sm">{insight}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">ACTIONABLE TIP</h4>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-500">
                    {actionableTip}
                  </p>
                </div>
                
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Learn Self-Management Strategies
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalizedInsights;
