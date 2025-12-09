
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProcessedEpisode } from '@/types';
import { 
  Lightbulb, 
  Target, 
  Shield, 
  Heart, 
  Share2,
  Thermometer,
  Wind,
  Clock,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PDFExportButton from './PDFExportButton';

interface EpisodeInsightsProps {
  episode: ProcessedEpisode;
}

const EpisodeInsights: React.FC<EpisodeInsightsProps> = ({ episode }) => {
  const { toast } = useToast();

  const getInsights = () => {
    const insights = [];
    
    // Severity-based insights
    if (episode.severityLevel >= 4) {
      insights.push({
        icon: <Target className="h-4 w-4" />,
        title: "High Severity Alert",
        description: "This was a severe episode. Consider reviewing your triggers and management strategies.",
        type: "warning"
      });
    }

    // Body area insights
    if (episode.bodyAreas.length > 2) {
      insights.push({
        icon: <Activity className="h-4 w-4" />,
        title: "Multiple Areas Affected",
        description: "Multiple body areas were affected. This might indicate a systemic trigger.",
        type: "info"
      });
    }

    // Trigger insights
    const environmentalTriggers = episode.triggers.filter(t => t.type === 'environmental');
    if (environmentalTriggers.length > 0) {
      insights.push({
        icon: <Thermometer className="h-4 w-4" />,
        title: "Environmental Triggers",
        description: "Environmental factors played a role. Consider adjusting your environment when possible.",
        type: "tip"
      });
    }

    return insights;
  };

  const getSelfManagementStrategies = () => {
    const strategies = [
      {
        icon: <Wind className="h-5 w-5" />,
        title: "Breathing Exercises",
        description: "Deep breathing can help reduce stress and cool the body",
        color: "bg-blue-50 border-blue-200",
        iconColor: "text-blue-600"
      },
      {
        icon: <Thermometer className="h-5 w-5" />,
        title: "Cool Environment",
        description: "Stay in air-conditioned spaces or use cooling products",
        color: "bg-cyan-50 border-cyan-200", 
        iconColor: "text-cyan-600"
      },
      {
        icon: <Heart className="h-5 w-5" />,
        title: "Stress Management",
        description: "Practice meditation, yoga, or other relaxation techniques",
        color: "bg-pink-50 border-pink-200",
        iconColor: "text-pink-600"
      },
      {
        icon: <Clock className="h-5 w-5" />,
        title: "Regular Schedule",
        description: "Maintain consistent daily routines to reduce trigger exposure",
        color: "bg-green-50 border-green-200",
        iconColor: "text-green-600"
      },
      {
        icon: <Shield className="h-5 w-5" />,
        title: "Trigger Avoidance",
        description: "Identify and avoid known triggers when possible",
        color: "bg-orange-50 border-orange-200",
        iconColor: "text-orange-600"
      },
      {
        icon: <Activity className="h-5 w-5" />,
        title: "Gentle Exercise",
        description: "Light physical activity can help manage stress and improve circulation",
        color: "bg-purple-50 border-purple-200",
        iconColor: "text-purple-600"
      }
    ];

    return strategies;
  };

  const handleShare = async () => {
    const shareData = {
      title: 'SweatSmart Episode Report',
      text: `Episode from ${episode.datetime.toLocaleDateString()} - Severity: ${episode.severityLevel}/5`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Episode details have been shared.",
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`SweatSmart Episode Report\nDate: ${episode.datetime.toLocaleDateString()}\nSeverity: ${episode.severityLevel}/5\nBody Areas: ${episode.bodyAreas.join(', ')}\nTriggers: ${episode.triggers.map(t => t.label).join(', ')}\n\nView details: ${window.location.href}`);
        toast({
          title: "Copied to clipboard",
          description: "Episode details have been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share failed",
        description: "Unable to share episode details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const insights = getInsights();
  const strategies = getSelfManagementStrategies();

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          onClick={handleShare}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Share2 className="h-4 w-4" />
          Share Episode
        </Button>
        <PDFExportButton episode={episode} className="w-full sm:w-auto" />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
              Episode Insights
            </CardTitle>
            <CardDescription className="text-sm">
              Personalized insights based on your episode data
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {insight.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base">{insight.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Self-Management Strategies */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            Self-Management Strategies
          </CardTitle>
          <CardDescription className="text-sm">
            Evidence-based techniques to help manage excessive sweating
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {strategies.map((strategy, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${strategy.color} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 p-2 rounded-lg bg-white/80 ${strategy.iconColor}`}>
                    {strategy.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
                      {strategy.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {strategy.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EpisodeInsights;
