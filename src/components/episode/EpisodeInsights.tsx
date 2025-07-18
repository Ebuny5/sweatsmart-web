
import React from 'react';
import { ProcessedEpisode, BodyArea, Trigger } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  MapPin, 
  Zap, 
  Download, 
  Share2, 
  CheckCircle, 
  Target,
  Calendar,
  Activity
} from 'lucide-react';

interface EpisodeInsightsProps {
  episode: ProcessedEpisode;
  totalEpisodes?: number;
}

const EpisodeInsights: React.FC<EpisodeInsightsProps> = ({ 
  episode, 
  totalEpisodes = 0 
}) => {
  // Helper function to get user-friendly body area labels
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

  // Helper function to get severity description with emotional context
  const getSeverityDescription = (level: number): string => {
    const descriptions: Record<number, string> = {
      1: 'Minimal (1/5) – barely noticeable, easily manageable',
      2: 'Mild (2/5) – slight discomfort, manageable with basic care',
      3: 'Moderate (3/5) – noticeable discomfort but manageable with care',
      4: 'Severe (4/5) – significant discomfort, requires immediate attention',
      5: 'Extreme (5/5) – overwhelming discomfort, urgent care needed'
    };
    return descriptions[level] || `Level ${level}/5`;
  };

  // Group triggers by type
  const groupedTriggers = episode.triggers.reduce((acc, trigger) => {
    const type = trigger.type || 'environmental';
    if (!acc[type]) acc[type] = [];
    acc[type].push(trigger);
    return acc;
  }, {} as Record<string, Trigger[]>);

  // Get recommendations based on body areas and triggers
  const getBodyAreaRecommendations = (area: BodyArea): { strategy: string; nextStep: string } => {
    const recommendations: Record<BodyArea, { strategy: string; nextStep: string }> = {
      palms: {
        strategy: 'Use antiperspirant on clean, dry hands before bed.',
        nextStep: 'Try applying antiperspirant tonight and check results tomorrow morning.'
      },
      soles: {
        strategy: 'Wear moisture-wicking socks and breathable shoes.',
        nextStep: 'Switch to cotton or merino wool socks for your next outing.'
      },
      face: {
        strategy: 'Use oil-free skincare products and keep cooling wipes handy.',
        nextStep: 'Carry facial wipes for quick touch-ups during the day.'
      },
      armpits: {
        strategy: 'Apply clinical-strength antiperspirant and wear breathable fabrics.',
        nextStep: 'Try a clinical-strength antiperspirant tonight before bed.'
      },
      head: {
        strategy: 'Use dry shampoo and consider shorter hairstyles for better ventilation.',
        nextStep: 'Keep a small towel handy for quick scalp drying.'
      },
      back: {
        strategy: 'Wear loose-fitting, moisture-wicking clothing.',
        nextStep: 'Choose a breathable cotton or athletic shirt for tomorrow.'
      },
      groin: {
        strategy: 'Use antifungal powder and wear breathable underwear.',
        nextStep: 'Switch to cotton underwear and apply antifungal powder.'
      },
      entireBody: {
        strategy: 'Focus on overall cooling strategies and stress management.',
        nextStep: 'Practice 5 minutes of deep breathing before your next trigger situation.'
      },
      other: {
        strategy: 'Monitor the specific area and apply general cooling techniques.',
        nextStep: 'Note the exact location and triggers for pattern tracking.'
      }
    };
    return recommendations[area];
  };

  const getTriggerRecommendations = (trigger: Trigger): { strategy: string; nextStep: string } => {
    const value = trigger.value.toLowerCase();
    
    if (trigger.type === 'environmental') {
      if (value.includes('hot') || value.includes('temperature')) {
        return {
          strategy: 'Pre-cool your body and stay in air-conditioned spaces when possible.',
          nextStep: 'Apply cooling towels to your neck before going outside tomorrow.'
        };
      }
      if (value.includes('humid')) {
        return {
          strategy: 'Use a dehumidifier indoors and seek dry, cool environments.',
          nextStep: 'Check the humidity forecast and plan indoor activities on high-humidity days.'
        };
      }
    }
    
    if (trigger.type === 'emotional') {
      if (value.includes('stress') || value.includes('anxiety')) {
        return {
          strategy: 'Practice deep breathing and mindfulness techniques.',
          nextStep: 'Try 1 minute of calm breathing before your next stressful situation.'
        };
      }
      if (value.includes('embarrassment')) {
        return {
          strategy: 'Prepare confidence-building phrases and carry emergency supplies.',
          nextStep: 'Practice positive self-talk and keep cooling wipes ready.'
        };
      }
    }
    
    if (trigger.type === 'dietary') {
      return {
        strategy: 'Track food triggers and avoid known problem foods before important events.',
        nextStep: 'Note what you eat 2 hours before episodes to identify patterns.'
      };
    }
    
    if (trigger.type === 'activity') {
      return {
        strategy: 'Prepare for physical activities with cooling strategies.',
        nextStep: 'Pre-cool with cold water on wrists before your next workout.'
      };
    }
    
    return {
      strategy: 'Monitor this trigger and develop personalized coping strategies.',
      nextStep: 'Keep a detailed log of when this trigger occurs.'
    };
  };

  const handleExport = () => {
    const exportData = {
      date: episode.datetime.toLocaleDateString(),
      severity: episode.severityLevel,
      bodyAreas: episode.bodyAreas.map(getBodyAreaLabel),
      triggers: episode.triggers.map(t => t.label),
      notes: episode.notes || 'No notes'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `episode-${episode.datetime.toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Episode Summary - SweatSmart',
      text: `Episode on ${episode.datetime.toLocaleDateString()}: Severity ${episode.severityLevel}/5, Areas affected: ${episode.bodyAreas.map(getBodyAreaLabel).join(', ')}`
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert('Episode summary copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Episode Summary Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Episode Summary
              </CardTitle>
              <CardDescription>
                {episode.datetime.toLocaleDateString()} at {episode.datetime.toLocaleTimeString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Sweating Severity</h4>
            <p className="text-sm text-muted-foreground">
              {getSeverityDescription(episode.severityLevel)}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Affected Areas</h4>
            <div className="flex flex-wrap gap-2">
              {episode.bodyAreas.map((area) => (
                <Badge key={area} variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  {getBodyAreaLabel(area)}
                </Badge>
              ))}
            </div>
          </div>

          {Object.keys(groupedTriggers).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Triggers</h4>
              <div className="space-y-2">
                {Object.entries(groupedTriggers).map(([type, triggers]) => (
                  <div key={type}>
                    <h5 className="text-sm font-medium capitalize mb-1">
                      {type === 'environmental' ? 'Environmental' : 
                       type === 'emotional' ? 'Emotional' :
                       type === 'dietary' ? 'Dietary' : 
                       type === 'activity' ? 'Activity' : type} Triggers
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {triggers.map((trigger, index) => (
                        <Badge key={index} variant="outline">
                          <Zap className="h-3 w-3 mr-1" />
                          {trigger.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {episode.notes && (
            <div>
              <h4 className="font-semibold mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground">{episode.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Tracker */}
      {totalEpisodes > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✨ You've logged {totalEpisodes} episodes this month — keep going! You're learning your patterns.
          </AlertDescription>
        </Alert>
      )}

      {/* Insights & Recommendations */}
      <Card id="insights-recommendations">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Personalized strategies based on your episode patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Body Area Insights */}
          {episode.bodyAreas.map((area) => {
            const recommendation = getBodyAreaRecommendations(area);
            return (
              <div key={area} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {getBodyAreaLabel(area)} Care Strategy
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Strategy:</strong> {recommendation.strategy}
                </p>
                <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                  <strong>What to do next:</strong> {recommendation.nextStep}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('treatment-options')?.scrollIntoView({ behavior: 'smooth' })}>
                    Explore Treatment Options
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('self-management')?.scrollIntoView({ behavior: 'smooth' })}>
                    Learn Self-Management Strategies
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Trigger Insights */}
          {Object.entries(groupedTriggers).map(([type, triggers]) => (
            <div key={type}>
              {triggers.map((trigger, index) => {
                const recommendation = getTriggerRecommendations(trigger);
                return (
                  <div key={`${type}-${index}`} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {trigger.label} Management
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Strategy:</strong> {recommendation.strategy}
                    </p>
                    <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                      <strong>What to do next:</strong> {recommendation.nextStep}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('treatment-options')?.scrollIntoView({ behavior: 'smooth' })}>
                        Explore Treatment Options
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('self-management')?.scrollIntoView({ behavior: 'smooth' })}>
                        Learn Self-Management Strategies
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Treatment Options */}
      <Card id="treatment-options">
        <CardHeader>
          <CardTitle>Clinical Treatment Options</CardTitle>
          <CardDescription>
            Evidence-based medical treatments for hyperhidrosis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Topical Medications</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Glycopyrrolate cream (0.5–4%)</strong> - Prescription wipes (Qbrexza®) with 82% sweat reduction</li>
                <li>• <strong>20% aluminum chloride hexahydrate</strong> - Strong OTC antiperspirant (Drysol®) for palms/soles</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Iontophoresis</h4>
              <p className="text-sm text-muted-foreground">
                Mild electrical current through water. Over 80% sweat reduction after 10–20 sessions. FDA-approved for hands, feet, and underarms.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Botox® Injections</h4>
              <p className="text-sm text-muted-foreground">
                Blocks sweat-triggering neurotransmitters. Effects last 3–9 months with 82–87% sweat reduction in treated areas.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Microwave Therapy (miraDry®)</h4>
              <p className="text-sm text-muted-foreground">
                FDA-approved thermal energy treatment that destroys underarm sweat glands. Provides long-lasting results with minimal downtime.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Oral Anticholinergics</h4>
              <p className="text-sm text-muted-foreground">
                Glycopyrrolate or Oxybutynin tablets for systemic sweat reduction. May cause dry mouth and headache side effects.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Surgical Options</h4>
              <p className="text-sm text-muted-foreground">
                Endoscopic Thoracic Sympathectomy (ETS) for severe cases. Highly effective but reserved for refractory palmar hyperhidrosis due to potential compensatory sweating.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Self-Management Strategies */}
      <Card id="self-management">
        <CardHeader>
          <CardTitle>Self-Management Tips</CardTitle>
          <CardDescription>
            Practical strategies you can implement today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Clothing & Fabrics</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Choose breathable, moisture-wicking fabrics like cotton and merino wool</li>
                <li>• Wear loose-fitting clothes to improve air circulation</li>
                <li>• Carry extra shirts or undershirts for quick changes</li>
                <li>• Use sweat-proof undershirts with moisture barriers</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Stress & Emotional Management</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Practice deep breathing exercises before stressful situations</li>
                <li>• Try progressive muscle relaxation techniques</li>
                <li>• Consider mindfulness meditation apps</li>
                <li>• Build confidence with positive self-talk and preparation</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Diet & Hydration</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Avoid spicy foods, caffeine, and alcohol before important events</li>
                <li>• Stay hydrated but avoid excessive fluid intake before social situations</li>
                <li>• Track food triggers in your episode log</li>
                <li>• Consider cooling foods like mint tea or cucumber water</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Temperature Regulation</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Pre-cool your body with cold water on wrists and neck</li>
                <li>• Use portable fans or cooling towels</li>
                <li>• Plan activities during cooler parts of the day</li>
                <li>• Keep cooling wipes for quick touch-ups</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EpisodeInsights;
