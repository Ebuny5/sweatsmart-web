
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Thermometer, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Heart,
  Lightbulb,
  FileText,
  Download,
  Share2
} from "lucide-react";
import { ProcessedEpisode, BodyArea, Trigger } from "@/types";

interface EpisodeInsightsProps {
  episode: ProcessedEpisode;
  episodeCount?: number;
}

const EpisodeInsights: React.FC<EpisodeInsightsProps> = ({ episode, episodeCount = 0 }) => {
  // User-friendly body area labels
  const getBodyAreaLabel = (area: BodyArea): string => {
    const labels: Record<BodyArea, string> = {
      palms: 'Palms',
      soles: 'Feet',
      face: 'Face',
      armpits: 'Underarms',
      head: 'Scalp',
      back: 'Back',
      groin: 'Groin',
      entireBody: 'Entire Body',
      other: 'Other Areas'
    };
    return labels[area] || area;
  };

  // Severity with emotional context
  const getSeverityDescription = (severity: number): string => {
    const descriptions: Record<number, string> = {
      1: 'Minimal (1/5) – barely noticeable, manageable',
      2: 'Mild (2/5) – noticeable but not concerning',
      3: 'Moderate (3/5) – noticeable discomfort but manageable with care',
      4: 'Severe (4/5) – significant discomfort affecting daily activities',
      5: 'Very Severe (5/5) – overwhelming, requires immediate attention'
    };
    return descriptions[severity] || `Level ${severity}/5`;
  };

  // Group triggers by type
  const groupedTriggers = episode.triggers.reduce((acc, trigger) => {
    if (!acc[trigger.type]) {
      acc[trigger.type] = [];
    }
    acc[trigger.type].push(trigger);
    return acc;
  }, {} as Record<string, Trigger[]>);

  const getRecommendation = (area: BodyArea): { strategy: string; nextStep: string } => {
    const recommendations: Record<BodyArea, { strategy: string; nextStep: string }> = {
      palms: {
        strategy: 'Use antiperspirant on dry hands before bed',
        nextStep: 'Apply hand antiperspirant tonight and track results tomorrow'
      },
      soles: {
        strategy: 'Wear moisture-wicking socks and breathable shoes',
        nextStep: 'Switch to bamboo or merino wool socks for your next outing'
      },
      face: {
        strategy: 'Use oil-free skincare and keep cooling wipes handy',
        nextStep: 'Pack face wipes in your bag for emergency touch-ups'
      },
      armpits: {
        strategy: 'Apply clinical-strength antiperspirant and wear breathable fabrics',
        nextStep: 'Try a prescription-strength antiperspirant tonight'
      },
      head: {
        strategy: 'Use a sweat-absorbing headband or hat',
        nextStep: 'Invest in a moisture-wicking headband for your next activity'
      },
      back: {
        strategy: 'Wear moisture-wicking base layers',
        nextStep: 'Choose loose-fitting, breathable clothing for tomorrow'
      },
      groin: {
        strategy: 'Use moisture-wicking underwear and loose-fitting clothes',
        nextStep: 'Switch to bamboo or moisture-wicking underwear'
      },
      entireBody: {
        strategy: 'Focus on stress management and cooling techniques',
        nextStep: 'Practice 5 minutes of deep breathing before stressful situations'
      },
      other: {
        strategy: 'Keep the area dry and use appropriate clothing',
        nextStep: 'Monitor this area closely and note any patterns'
      }
    };
    return recommendations[area];
  };

  const getTriggerRecommendation = (trigger: Trigger): { strategy: string; nextStep: string } => {
    const triggerRecommendations: Record<string, { strategy: string; nextStep: string }> = {
      stress: {
        strategy: 'Practice deep breathing and mindfulness techniques',
        nextStep: 'Try 1 minute of calm breathing before your next stressful situation'
      },
      anxiety: {
        strategy: 'Use grounding techniques and progressive muscle relaxation',
        nextStep: 'Practice the 5-4-3-2-1 grounding technique when you feel anxious'
      },
      hotTemperature: {
        strategy: 'Stay in air-conditioned spaces and use cooling products',
        nextStep: 'Carry a portable fan or cooling towel for hot environments'
      },
      spicyFood: {
        strategy: 'Avoid spicy foods and opt for milder alternatives',
        nextStep: 'Plan your next meal with cooling foods like cucumber or yogurt'
      },
      physicalExercise: {
        strategy: 'Exercise in cooler environments and stay hydrated',
        nextStep: 'Schedule your next workout during cooler hours or in AC'
      }
    };
    return triggerRecommendations[trigger.value] || {
      strategy: 'Monitor this trigger and avoid when possible',
      nextStep: 'Keep track of when this trigger affects you most'
    };
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Tracker */}
      {episodeCount > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                ✨ You've logged {episodeCount} episodes this month — keep going! You're learning your patterns.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Episode Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Episode Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Sweating Severity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getSeverityDescription(episode.severityLevel)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Affected Areas</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {episode.bodyAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {getBodyAreaLabel(area)}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-medium">Triggers Identified</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {episode.triggers.length} trigger(s) detected
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Summary
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigator.share?.({ title: 'SweatSmart Episode Summary', text: 'My hyperhidrosis episode summary' })}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <div id="insights-recs">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Insights & Recommendations
            </CardTitle>
            <CardDescription>
              Personalized suggestions based on your episode data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Body Area Insights */}
            {episode.bodyAreas.map((area) => {
              const recommendation = getRecommendation(area);
              return (
                <div key={area} className="insight-card p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {getBodyAreaLabel(area)} Management
                  </h3>
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Strategy:</strong> {recommendation.strategy}
                  </p>
                  <p className="text-xs text-blue-700 mb-3">
                    <strong>What to do next:</strong> {recommendation.nextStep}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => scrollToSection('treatment-options')}
                    className="text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    Explore Treatment Options
                  </Button>
                </div>
              );
            })}

            {/* Trigger Insights */}
            {Object.entries(groupedTriggers).map(([triggerType, triggers]) => {
              const typeLabel = triggerType.charAt(0).toUpperCase() + triggerType.slice(1);
              return (
                <div key={triggerType} className="insight-card p-4 border rounded-lg bg-amber-50">
                  <h3 className="font-semibold text-amber-900 mb-2">
                    {typeLabel} Triggers
                  </h3>
                  {triggers.map((trigger, index) => {
                    const recommendation = getTriggerRecommendation(trigger);
                    return (
                      <div key={index} className="mb-4 last:mb-2">
                        <p className="text-sm text-amber-800 mb-1">
                          <strong>{trigger.label}</strong> was identified as a trigger.
                        </p>
                        <p className="text-sm text-amber-800 mb-2">
                          <strong>Strategy:</strong> {recommendation.strategy}
                        </p>
                        <p className="text-xs text-amber-700 mb-3">
                          <strong>What to do next:</strong> {recommendation.nextStep}
                        </p>
                      </div>
                    );
                  })}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => scrollToSection('self-management')}
                    className="text-amber-700 border-amber-200 hover:bg-amber-100"
                  >
                    Learn Self-Management Strategies
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Treatment Options */}
      <div id="treatment-options">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Clinical Treatment Options
            </CardTitle>
            <CardDescription>
              Evidence-based medical treatments for hyperhidrosis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Topical Medications</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li><strong>Glycopyrrolate cream (0.5–4%)</strong> - Prescription wipes (Qbrexza®) that block sweat-gland stimulation. Up to 82% reduction vs placebo.</li>
                  <li><strong>20% Aluminum chloride hexahydrate</strong> - Strong OTC antiperspirant (Drysol®) that blocks sweat ducts. Most effective first-line treatment for palms/feet.</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Iontophoresis</h4>
                <p className="text-sm text-muted-foreground">
                  Delivers mild electrical current through water to hands, feet, or underarms. <strong>Efficacy:</strong> >80% reduction after 10–20 treatments.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Botox® Injections</h4>
                <p className="text-sm text-muted-foreground">
                  Blocks neurotransmitters that trigger sweating. <strong>Duration:</strong> 3–9 months with 82–87% sweat reduction in underarms and palms.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Microwave Therapy (miraDry®)</h4>
                <p className="text-sm text-muted-foreground">
                  FDA-approved device using controlled thermal energy to destroy underarm sweat glands. Durable results, rare nerve-related side effects.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Oral Anticholinergics</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Glycopyrrolate or Oxybutynin</strong> tablets reduce overall sweat gland activity. <strong>Side effects:</strong> dry mouth, headache.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Surgical Options</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Endoscopic Thoracic Sympathectomy (ETS)</strong> for severe palmar hyperhidrosis. Highly effective but reserved for refractory cases due to compensatory sweating risk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Self-Management Strategies */}
      <div id="self-management">
        <Card>
          <CardHeader>
            <CardTitle>Self-Management Tips</CardTitle>
            <CardDescription>
              Practical strategies you can implement today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Clothing & Fabric Choices</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Choose moisture-wicking fabrics (bamboo, merino wool)</li>
                  <li>• Wear loose-fitting, breathable clothing</li>
                  <li>• Avoid synthetic fabrics that trap moisture</li>
                  <li>• Layer clothing for easy adjustment</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Stress Management</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Practice deep breathing exercises (4-7-8 technique)</li>
                  <li>• Try progressive muscle relaxation</li>
                  <li>• Use mindfulness meditation apps</li>
                  <li>• Establish regular sleep schedule</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Diet & Lifestyle</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Limit spicy foods, caffeine, and alcohol</li>
                  <li>• Stay hydrated with cool water</li>
                  <li>• Eat cooling foods (cucumber, yogurt, watermelon)</li>
                  <li>• Exercise during cooler hours</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Temperature Regulation</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Carry portable fans or cooling towels</li>
                  <li>• Use air conditioning when available</li>
                  <li>• Take cool showers before important events</li>
                  <li>• Keep ice packs or cooling gels handy</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EpisodeInsights;
