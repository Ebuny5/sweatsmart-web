
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeverityLevel, BodyArea, Trigger } from "@/types";
import { 
  Lightbulb, 
  AlertTriangle, 
  Heart, 
  TrendingUp, 
  MapPin, 
  Thermometer,
  ExternalLink,
  Target,
  Activity
} from "lucide-react";

interface EpisodeInsightsProps {
  severity: SeverityLevel;
  bodyAreas: BodyArea[];
  triggers: Trigger[];
}

const EpisodeInsights: React.FC<EpisodeInsightsProps> = ({
  severity,
  bodyAreas,
  triggers,
}) => {
  const getSeverityLabel = (level: SeverityLevel) => {
    const labels = {
      1: "Mild",
      2: "Light-Moderate",
      3: "Moderate", 
      4: "Severe",
      5: "Extreme"
    };
    return labels[level] || "Moderate";
  };

  const getSeverityColor = (level: SeverityLevel) => {
    if (level <= 2) return "text-green-600 bg-green-50 border-green-200";
    if (level === 3) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // Deduplicate body areas and get unique insights
  const uniqueBodyAreas = [...new Set(bodyAreas)];
  
  // Deduplicate triggers by type and value
  const uniqueTriggers = triggers.reduce((acc, trigger) => {
    const key = `${trigger.type}-${trigger.value}`;
    if (!acc.some(t => `${t.type}-${t.value}` === key)) {
      acc.push(trigger);
    }
    return acc;
  }, [] as Trigger[]);

  const getBodyAreaInsight = (area: BodyArea) => {
    const insights = {
      palms: {
        observation: "Palmar hyperhidrosis detected",
        tip: "Apply antiperspirant lotions designed for hands before bed"
      },
      face: {
        observation: "Facial sweating episode recorded", 
        tip: "Use oil-free, non-comedogenic products and keep cooling wipes handy"
      },
      armpits: {
        observation: "Axillary hyperhidrosis episode",
        tip: "Apply clinical-strength antiperspirant nightly for better effectiveness"
      },
      soles: {
        observation: "Plantar hyperhidrosis on feet",
        tip: "Use moisture-wicking socks and antifungal powder to prevent complications"
      },
      back: {
        observation: "Back sweating documented",
        tip: "Choose breathable, loose-fitting clothing with moisture-wicking properties"
      },
      chest: {
        observation: "Chest area sweating recorded",
        tip: "Layer clothing and use undershirts to manage moisture effectively"
      }
    };
    
    return insights[area] || {
      observation: `${area} sweating episode`,
      tip: "Focus on keeping this area cool and dry with appropriate strategies"
    };
  };

  const getTriggerInsight = (trigger: Trigger) => {
    const insights = {
      emotional: {
        context: "Stress response triggered sweating episode",
        strategy: "Practice deep breathing exercises and mindfulness techniques before stressful situations"
      },
      environmental: {
        context: "Environmental factor contributed to episode", 
        strategy: "Prepare cooling strategies and dress appropriately for similar conditions"
      },
      dietary: {
        context: "Food trigger identified in this episode",
        strategy: "Keep a detailed food diary and avoid trigger foods before important events"
      },
      activity: {
        context: "Physical activity or situation triggered response",
        strategy: "Plan ahead with cooling products and appropriate clothing choices"
      }
    };

    const baseInsight = insights[trigger.type] || {
      context: "Trigger factor detected",
      strategy: "Monitor this pattern and develop coping strategies"
    };

    // Customize based on specific trigger
    if (trigger.type === 'environmental' && trigger.label?.toLowerCase().includes('temperature')) {
      return {
        context: "Temperature sensitivity triggered sweating",
        strategy: "Use portable cooling devices and dress in layers for temperature control"
      };
    }

    if (trigger.type === 'emotional' && trigger.label?.toLowerCase().includes('stress')) {
      return {
        context: "Stress/anxiety response detected",
        strategy: "Develop a pre-event routine with relaxation techniques to manage anxiety"
      };
    }

    return baseInsight;
  };

  return (
    <div className="space-y-6">
      {/* Episode Summary */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Episode Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={`p-3 rounded-lg border ${getSeverityColor(severity)}`}>
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className="h-4 w-4" />
                <span className="font-medium text-sm">Severity</span>
              </div>
              <div className="text-lg font-bold">{getSeverityLabel(severity)}</div>
              <div className="text-sm opacity-75">{severity}/5 intensity</div>
            </div>
            
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm text-blue-700">Body Areas</span>
              </div>
              <div className="text-lg font-bold text-blue-700">{uniqueBodyAreas.length}</div>
              <div className="text-sm text-blue-600">
                {uniqueBodyAreas.length === 1 ? 'area affected' : 'areas affected'}
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm text-purple-700">Triggers</span>
              </div>
              <div className="text-lg font-bold text-purple-700">{uniqueTriggers.length}</div>
              <div className="text-sm text-purple-600">
                {uniqueTriggers.length === 1 ? 'factor identified' : 'factors identified'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Body Area Insights */}
        {uniqueBodyAreas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Body Area Analysis
              </CardTitle>
              <CardDescription>
                Affected areas and targeted recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uniqueBodyAreas.map((area, index) => {
                const insight = getBodyAreaInsight(area);
                return (
                  <div key={area} className="p-4 border rounded-lg bg-blue-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="capitalize">
                        {area}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Observation
                        </h4>
                        <p className="text-sm">{insight.observation}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Recommendation
                        </h4>
                        <p className="text-sm bg-white p-2 rounded border-l-4 border-l-blue-500">
                          {insight.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Trigger Insights */}
        {uniqueTriggers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Trigger Analysis
              </CardTitle>
              <CardDescription>
                Contributing factors and coping strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uniqueTriggers.map((trigger, index) => {
                const insight = getTriggerInsight(trigger);
                return (
                  <div key={`${trigger.type}-${trigger.value}-${index}`} className="p-4 border rounded-lg bg-purple-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {trigger.type}
                        </Badge>
                        <span className="text-sm font-medium">{trigger.label}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Context
                        </h4>
                        <p className="text-sm">{insight.context}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Strategy
                        </h4>
                        <p className="text-sm bg-white p-2 rounded border-l-4 border-l-purple-500">
                          {insight.strategy}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Items */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            Immediate Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="bg-green-50 border-green-200">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Continue Tracking</AlertTitle>
            <AlertDescription className="text-green-600">
              Log similar episodes to identify patterns and track your progress over time.
            </AlertDescription>
          </Alert>

          {severity >= 4 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Consider Professional Help</AlertTitle>
              <AlertDescription className="text-red-600">
                High severity episodes may benefit from medical consultation about treatment options.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              Treatment Options
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-3 w-3 mr-1" />
              Self-Care Tips
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EpisodeInsights;
