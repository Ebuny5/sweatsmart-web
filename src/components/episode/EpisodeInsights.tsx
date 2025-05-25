
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SeverityLevel, BodyArea, Trigger } from "@/types";
import { Lightbulb, AlertTriangle, Heart, TrendingUp } from "lucide-react";

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
  const getRecommendations = () => {
    const recommendations = [];
    
    // Severity-based recommendations
    if (severity >= 4) {
      recommendations.push({
        type: "urgent",
        title: "High Severity Episode",
        message: "Consider consulting with a healthcare provider about treatment options like prescription antiperspirants or botox injections.",
        icon: AlertTriangle,
      });
    } else if (severity >= 3) {
      recommendations.push({
        type: "moderate",
        title: "Moderate Sweating",
        message: "Try clinical-strength antiperspirants and consider cooling strategies for future similar situations.",
        icon: TrendingUp,
      });
    }
    
    // Body area specific recommendations
    if (bodyAreas.includes("palms")) {
      recommendations.push({
        type: "tip",
        title: "Palm Sweating",
        message: "Consider iontophoresis treatment or antiperspirant lotions specifically designed for hands.",
        icon: Lightbulb,
      });
    }
    
    if (bodyAreas.includes("face")) {
      recommendations.push({
        type: "tip",
        title: "Facial Sweating",
        message: "Use oil-free, non-comedogenic skincare products and consider cooling facial wipes for emergencies.",
        icon: Lightbulb,
      });
    }
    
    if (bodyAreas.includes("armpits")) {
      recommendations.push({
        type: "tip",
        title: "Underarm Sweating",
        message: "Apply antiperspirant at night for better effectiveness. Consider breathable, moisture-wicking fabrics.",
        icon: Lightbulb,
      });
    }
    
    // Trigger-based recommendations
    triggers.forEach(trigger => {
      if (trigger.type === "emotional") {
        recommendations.push({
          type: "wellness",
          title: "Emotional Trigger Detected",
          message: "Practice stress management techniques like deep breathing, meditation, or progressive muscle relaxation.",
          icon: Heart,
        });
      }
      
      if (trigger.type === "environmental" && trigger.value.includes("Temperature")) {
        recommendations.push({
          type: "tip",
          title: "Temperature Management",
          message: "Dress in layers, use cooling products, and stay hydrated. Consider portable fans or cooling towels.",
          icon: Lightbulb,
        });
      }
      
      if (trigger.type === "dietary") {
        recommendations.push({
          type: "tip",
          title: "Dietary Trigger",
          message: "Consider avoiding this trigger food before important events. Keep a food diary to identify patterns.",
          icon: Lightbulb,
        });
      }
    });
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        type: "general",
        title: "General Advice",
        message: "Stay hydrated, wear breathable fabrics, and keep logging episodes to identify patterns.",
        icon: Lightbulb,
      });
    }
    
    return recommendations;
  };
  
  const recommendations = getRecommendations();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Immediate Insights
        </CardTitle>
        <CardDescription>
          Personalized recommendations based on this episode
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => (
          <Alert key={index} className={`border-l-4 ${
            rec.type === "urgent" ? "border-l-red-500 bg-red-50" :
            rec.type === "moderate" ? "border-l-orange-500 bg-orange-50" :
            rec.type === "wellness" ? "border-l-blue-500 bg-blue-50" :
            "border-l-green-500 bg-green-50"
          }`}>
            <rec.icon className="h-4 w-4" />
            <AlertTitle className="text-sm font-medium">{rec.title}</AlertTitle>
            <AlertDescription className="text-sm">
              {rec.message}
            </AlertDescription>
          </Alert>
        ))}
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Episode Summary:</strong> Severity {severity}/5 affecting{" "}
            {bodyAreas.length} body area{bodyAreas.length !== 1 ? "s" : ""}{" "}
            {triggers.length > 0 && `with ${triggers.length} trigger${triggers.length !== 1 ? "s" : ""} identified`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EpisodeInsights;
