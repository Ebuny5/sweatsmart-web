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
import jsPDF from 'jspdf';
import { useEpisodes } from '@/hooks/useEpisodes';
import { useToast } from '@/hooks/use-toast';

interface EpisodeInsightsProps {
  episode: ProcessedEpisode;
  totalEpisodes?: number;
}

const EpisodeInsights: React.FC<EpisodeInsightsProps> = ({ 
  episode, 
  totalEpisodes = 0 
}) => {
  const { episodes } = useEpisodes();
  const { toast } = useToast();

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
    const value = trigger.label.toLowerCase();
    
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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, maxWidth: number, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, yPosition);
      yPosition += lines.length * (fontSize * 0.4) + 5;
      return lines.length;
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace = 30) => {
      if (yPosition + requiredSpace > doc.internal.pageSize.height - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SweatSmart Episode Report', margin, yPosition);
    yPosition += 20;

    // All Episodes Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('All Episodes Summary', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Episodes: ${episodes.length}`, margin, yPosition);
    yPosition += 10;

    if (episodes.length > 0) {
      // Episodes table header
      checkNewPage(50);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', margin, yPosition);
      doc.text('Severity', margin + 40, yPosition);
      doc.text('Body Areas', margin + 80, yPosition);
      doc.text('Triggers', margin + 130, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      
      episodes.forEach((ep) => {
        checkNewPage(20);
        
        const dateStr = ep.datetime.toLocaleDateString();
        const bodyAreasStr = ep.bodyAreas.map(getBodyAreaLabel).join(', ');
        const triggersStr = ep.triggers.map(t => t.label).join(', ');
        
        doc.text(dateStr, margin, yPosition);
        doc.text(ep.severityLevel.toString(), margin + 40, yPosition);
        
        // Handle long text for body areas and triggers
        const bodyAreaLines = doc.splitTextToSize(bodyAreasStr, 45);
        const triggerLines = doc.splitTextToSize(triggersStr, 50);
        
        doc.text(bodyAreaLines[0] || '', margin + 80, yPosition);
        doc.text(triggerLines[0] || '', margin + 130, yPosition);
        
        if (bodyAreaLines.length > 1 || triggerLines.length > 1) {
          yPosition += 8;
          for (let i = 1; i < Math.max(bodyAreaLines.length, triggerLines.length); i++) {
            checkNewPage(8);
            if (bodyAreaLines[i]) doc.text(bodyAreaLines[i], margin + 80, yPosition);
            if (triggerLines[i]) doc.text(triggerLines[i], margin + 130, yPosition);
            yPosition += 8;
          }
        }
        
        yPosition += 12;
      });
    }

    // Current Episode Details
    checkNewPage(60);
    yPosition += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Current Episode Details', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    addWrappedText(`Date: ${episode.datetime.toLocaleDateString()} at ${episode.datetime.toLocaleTimeString()}`, margin, pageWidth - 2 * margin, 12);
    addWrappedText(`Severity: ${getSeverityDescription(episode.severityLevel)}`, margin, pageWidth - 2 * margin, 12);

    if (episode.bodyAreas.length > 0) {
      addWrappedText(`Affected Areas: ${episode.bodyAreas.map(getBodyAreaLabel).join(', ')}`, margin, pageWidth - 2 * margin, 12);
    }

    if (episode.triggers.length > 0) {
      addWrappedText(`Triggers: ${episode.triggers.map(t => t.label).join(', ')}`, margin, pageWidth - 2 * margin, 12);
    }

    if (episode.notes) {
      addWrappedText(`Notes: ${episode.notes}`, margin, pageWidth - 2 * margin, 12);
    }

    // Recommendations
    checkNewPage(80);
    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Personalized Recommendations', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Body area recommendations
    episode.bodyAreas.forEach((area) => {
      checkNewPage(30);
      const recommendation = getBodyAreaRecommendations(area);
      
      doc.setFont('helvetica', 'bold');
      addWrappedText(`${getBodyAreaLabel(area)} Care:`, margin, pageWidth - 2 * margin, 10);
      
      doc.setFont('helvetica', 'normal');
      addWrappedText(`Strategy: ${recommendation.strategy}`, margin, pageWidth - 2 * margin, 10);
      addWrappedText(`Next Step: ${recommendation.nextStep}`, margin, pageWidth - 2 * margin, 10);
      yPosition += 5;
    });

    // Trigger recommendations
    episode.triggers.forEach((trigger) => {
      checkNewPage(30);
      const recommendation = getTriggerRecommendations(trigger);
      
      doc.setFont('helvetica', 'bold');
      addWrappedText(`${trigger.label} Management:`, margin, pageWidth - 2 * margin, 10);
      
      doc.setFont('helvetica', 'normal');
      addWrappedText(`Strategy: ${recommendation.strategy}`, margin, pageWidth - 2 * margin, 10);
      addWrappedText(`Next Step: ${recommendation.nextStep}`, margin, pageWidth - 2 * margin, 10);
      yPosition += 5;
    });

    // Save the PDF
    const fileName = `sweatsmart-episode-report-${episode.datetime.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleShare = async () => {
    const shareText = `SweatSmart Episode Summary

📅 Date: ${episode.datetime.toLocaleDateString()} at ${episode.datetime.toLocaleTimeString()}
🌡️ Severity: ${getSeverityDescription(episode.severityLevel)}
📍 Affected Areas: ${episode.bodyAreas.map(getBodyAreaLabel).join(', ')}
⚡ Triggers: ${episode.triggers.map(t => t.label).join(', ')}
${episode.notes ? `📝 Notes: ${episode.notes}` : ''}

Generated by SweatSmart - Track your hyperhidrosis patterns`;

    const shareData = {
      title: 'SweatSmart Episode Summary',
      text: shareText,
      url: window.location.origin
    };

    // Use native Web Share API if available (works on mobile devices)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully!",
          description: "Episode summary has been shared.",
        });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // User cancelled sharing, don't show error
          return;
        }
        console.error('Native share failed:', error);
      }
    }

    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Episode summary copied. You can now paste it in any app to share.",
        duration: 4000,
      });
    } catch (error) {
      console.error('Clipboard write failed:', error);
      toast({
        title: "Share failed",
        description: "Unable to share or copy the episode summary. Please try again.",
        variant: "destructive"
      });
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
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
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
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Clothing & Fabrics
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="p-2 bg-muted rounded">
                    • Choose breathable, moisture-wicking fabrics like cotton and merino wool
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Wear loose-fitting clothes to improve air circulation
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Carry extra shirts or undershirts for quick changes
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Use sweat-proof undershirts with moisture barriers
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Stress & Emotional Management
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="p-2 bg-muted rounded">
                    • Practice deep breathing exercises before stressful situations
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Try progressive muscle relaxation techniques
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Consider mindfulness meditation apps
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Build confidence with positive self-talk and preparation
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Diet & Hydration
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="p-2 bg-muted rounded">
                    • Avoid spicy foods, caffeine, and alcohol before important events
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Stay hydrated but avoid excessive fluid intake before social situations
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Track food triggers in your episode log
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Consider cooling foods like mint tea or cucumber water
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Temperature Regulation
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="p-2 bg-muted rounded">
                    • Pre-cool your body with cold water on wrists and neck
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Use portable fans or cooling towels
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Plan activities during cooler parts of the day
                  </div>
                  <div className="p-2 bg-muted rounded">
                    • Keep cooling wipes for quick touch-ups
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EpisodeInsights;
