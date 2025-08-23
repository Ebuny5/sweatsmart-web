
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TriggerFrequency, BodyAreaFrequency } from "@/types";
import { Target, TrendingUp, ExternalLink, Thermometer, Heart, Activity } from "lucide-react";

interface PersonalizedInsightsProps {
  episodes: any[];
}

interface DeduplicatedInsight {
  id: string;
  type: 'trigger' | 'bodyArea';
  title: string;
  summary: string;
  details: string;
  actions: {
    immediate: string;
    selfManagement: string;
  };
  confidence: 'Low' | 'Medium' | 'High';
  evidenceTag: string;
  percentage: number;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
}

const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({ episodes }) => {
  const [deduplicatedInsights, setDeduplicatedInsights] = useState<DeduplicatedInsight[]>([]);

  useEffect(() => {
    if (episodes.length === 0) return;

    const insights: DeduplicatedInsight[] = [];
    const seenInsights = new Set<string>();

    // Calculate trigger frequencies and deduplicate
    const triggerCounts: { [key: string]: { count: number; totalSeverity: number; triggerData: any } } = {};
    
    episodes.forEach(episode => {
      if (episode.triggers && Array.isArray(episode.triggers)) {
        episode.triggers.forEach((trigger: any) => {
          let triggerKey: string;
          let triggerType: string;
          let triggerValue: string;
          
          if (typeof trigger === 'string') {
            try {
              const parsed = JSON.parse(trigger);
              triggerType = parsed.type || 'environmental';
              triggerValue = parsed.value || trigger;
              triggerKey = `${triggerType}_${triggerValue}`;
            } catch {
              triggerType = 'environmental';
              triggerValue = trigger;
              triggerKey = `environmental_${trigger}`;
            }
          } else {
            triggerType = trigger.type || 'environmental';
            triggerValue = trigger.value || trigger.label || 'Unknown';
            triggerKey = `${triggerType}_${triggerValue}`;
          }

          if (!triggerCounts[triggerKey]) {
            triggerCounts[triggerKey] = { 
              count: 0, 
              totalSeverity: 0, 
              triggerData: { type: triggerType, value: triggerValue }
            };
          }
          triggerCounts[triggerKey].count++;
          triggerCounts[triggerKey].totalSeverity += episode.severity || 0;
        });
      }
    });

    // Process top triggers (max 2 to avoid duplicates)
    const topTriggers = Object.entries(triggerCounts)
      .map(([key, data]) => ({
        key,
        trigger: data.triggerData,
        count: data.count,
        averageSeverity: data.totalSeverity / data.count,
        percentage: Math.round((data.count / episodes.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);

    topTriggers.forEach(triggerData => {
      const insightKey = `trigger_${triggerData.key}`;
      if (seenInsights.has(insightKey)) return;
      seenInsights.add(insightKey);

      const humanizedTrigger = humanizeTrigger(triggerData.trigger);
      const confidence: 'Low' | 'Medium' | 'High' = triggerData.percentage >= 40 ? 'High' : triggerData.percentage >= 20 ? 'Medium' : 'Low';

      insights.push({
        id: insightKey,
        type: 'trigger',
        title: `Primary Trigger — ${humanizedTrigger.label}`,
        summary: `This trigger appears in ${triggerData.percentage}% of your episodes (${triggerData.count}/${episodes.length}).`,
        details: humanizedTrigger.description,
        actions: {
          immediate: humanizedTrigger.immediateAction,
          selfManagement: humanizedTrigger.selfManagement
        },
        confidence,
        evidenceTag: `${triggerData.count} episodes with avg severity ${triggerData.averageSeverity.toFixed(1)}`,
        percentage: triggerData.percentage,
        icon: triggerData.trigger.type === 'emotional' 
          ? <Heart className="h-5 w-5 text-pink-600" />
          : <Thermometer className="h-5 w-5 text-orange-600" />,
        borderColor: triggerData.trigger.type === 'emotional' ? 'border-l-pink-500' : 'border-l-orange-500',
        bgColor: triggerData.trigger.type === 'emotional' ? 'bg-pink-50/50' : 'bg-orange-50/50'
      });
    });

    // Calculate body area frequencies (max 1 to avoid clutter)
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

    const topBodyArea = Object.entries(bodyAreaCounts)
      .map(([area, data]) => ({
        area,
        count: data.count,
        averageSeverity: data.totalSeverity / data.count,
        percentage: Math.round((data.count / episodes.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)[0];

    if (topBodyArea) {
      const bodyAreaInsight = humanizeBodyArea(topBodyArea.area);
      const confidence: 'Low' | 'Medium' | 'High' = topBodyArea.percentage >= 60 ? 'High' : topBodyArea.percentage >= 40 ? 'Medium' : 'Low';

      insights.push({
        id: `bodyArea_${topBodyArea.area}`,
        type: 'bodyArea',
        title: `Body Area Pattern — ${bodyAreaInsight.label}`,
        summary: `${bodyAreaInsight.label} sweating occurs in ${topBodyArea.percentage}% of your episodes.`,
        details: bodyAreaInsight.description,
        actions: {
          immediate: bodyAreaInsight.immediateAction,
          selfManagement: bodyAreaInsight.selfManagement
        },
        confidence,
        evidenceTag: `${topBodyArea.count} episodes with avg severity ${topBodyArea.averageSeverity.toFixed(1)}`,
        percentage: topBodyArea.percentage,
        icon: <Activity className="h-5 w-5 text-blue-600" />,
        borderColor: 'border-l-blue-500',
        bgColor: 'bg-blue-50/50'
      });
    }

    setDeduplicatedInsights(insights);
  }, [episodes]);

  const humanizeTrigger = (trigger: any) => {
    const value = trigger.value?.toLowerCase() || '';
    const type = trigger.type || 'environmental';
    
    if (type === 'emotional' || value.includes('stress') || value.includes('anxiety')) {
      return {
        label: 'Stress / Anxiety',
        description: 'Emotional stress or anxiety activated your sympathetic nervous system, leading to increased sweating.',
        immediateAction: 'Practice deep breathing exercises or step away to a quiet space to calm your nervous system.',
        selfManagement: 'Consider regular meditation, yoga, or stress management techniques to build resilience.'
      };
    } else if (value.includes('hot') || value.includes('temperature') || value.includes('heat')) {
      return {
        label: 'Heat / Hot Environments',
        description: 'High temperatures or poorly ventilated spaces triggered excessive sweating episodes.',
        immediateAction: 'Move to a cool environment and use cooling wipes, fans, or cold water on pulse points.',
        selfManagement: 'Wear breathable, moisture-wicking clothing and avoid peak heat hours when possible.'
      };
    } else if (value.includes('crowd') || value.includes('social') || value.includes('public')) {
      return {
        label: 'Crowded / Social Environments',
        description: 'Social situations or crowded spaces may trigger anxiety-related sweating responses.',
        immediateAction: 'Step away to a quieter area and practice grounding techniques like 5-4-3-2-1 sensory awareness.',
        selfManagement: 'Prepare coping strategies before social events and consider gradual exposure therapy.'
      };
    } else {
      return {
        label: 'Environmental Factor',
        description: 'An environmental or situational factor contributed to your sweating episodes.',
        immediateAction: 'Remove yourself from the triggering situation if possible and find a comfortable environment.',
        selfManagement: 'Track this pattern over time to better prepare for similar situations in the future.'
      };
    }
  };

  const humanizeBodyArea = (area: string) => {
    switch (area.toLowerCase()) {
      case 'palms':
        return {
          label: 'Palms',
          description: 'Excessive palm sweating can interfere with daily activities like handshakes, writing, or using devices.',
          immediateAction: 'Keep your hands cool and dry with antiperspirant lotions designed for hands.',
          selfManagement: 'Consider carrying a small towel and using clinical-strength antiperspirants at bedtime.'
        };
      case 'armpits':
        return {
          label: 'Underarms',
          description: 'Underarm sweating is common but can be managed with proper products and clothing choices.',
          immediateAction: 'Apply antiperspirant at night for better effectiveness and choose breathable fabrics.',
          selfManagement: 'Use clinical-strength antiperspirants and wear moisture-wicking, loose-fitting clothing.'
        };
      case 'face':
        return {
          label: 'Face',
          description: 'Facial sweating can be particularly distressing as it\'s highly visible in social situations.',
          immediateAction: 'Use oil-free, non-comedogenic skincare products and keep cooling facial wipes handy.',
          selfManagement: 'Avoid spicy foods and hot beverages, and consider lightweight, breathable makeup if used.'
        };
      case 'feet':
      case 'soles':
        return {
          label: 'Feet',
          description: 'Foot sweating can lead to discomfort, odor, and potential skin issues if not managed properly.',
          immediateAction: 'Change to clean, dry socks and use antifungal powder to prevent moisture buildup.',
          selfManagement: 'Wear breathable shoes, rotate footwear daily, and use moisture-wicking socks.'
        };
      default:
        return {
          label: area.charAt(0).toUpperCase() + area.slice(1),
          description: 'This body area experiences frequent sweating that may benefit from targeted management.',
          immediateAction: 'Keep this area cool and dry with appropriate clothing choices and cooling strategies.',
          selfManagement: 'Monitor triggers specific to this area and maintain good hygiene practices.'
        };
    }
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (episodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {deduplicatedInsights.map((insight) => (
          <Card key={insight.id} className={`border-l-4 ${insight.borderColor} ${insight.bgColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {insight.icon}
                  {insight.title}
                </CardTitle>
                <Badge className={`text-xs ${getConfidenceBadgeColor(insight.confidence)}`}>
                  {insight.confidence}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">INSIGHT</h4>
                <p className="text-sm font-medium">{insight.summary}</p>
                <p className="text-xs text-muted-foreground">{insight.details}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">IMMEDIATE ACTION</h4>
                <p className="text-sm bg-green-50 p-3 rounded-lg border-l-4 border-l-green-500 text-green-800">
                  {insight.actions.immediate}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">SELF-MANAGEMENT</h4>
                <p className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-500 text-blue-800">
                  {insight.actions.selfManagement}
                </p>
              </div>
              
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs text-muted-foreground">
                  Evidence: {insight.evidenceTag}
                </p>
                <Button variant="outline" size="sm" className="text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Export for Clinician
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedInsights;
