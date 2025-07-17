
import React from "react";
import { ProcessedEpisode } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Share2, 
  Lightbulb, 
  TrendingUp, 
  Target,
  CheckCircle,
  AlertTriangle,
  Thermometer
} from "lucide-react";

interface EpisodeInsightsProps {
  episode: ProcessedEpisode;
}

const EpisodeInsights = ({ episode }: EpisodeInsightsProps) => {
  // User-friendly body area labels
  const getBodyAreaLabel = (area: string) => {
    const labels: { [key: string]: string } = {
      'head': 'Scalp',
      'soles': 'Feet',
      'palms': 'Palms',
      'face': 'Face',
      'underarms': 'Underarms',
      'back': 'Back',
      'chest': 'Chest'
    };
    return labels[area] || area;
  };

  // Severity description with emotion
  const getSeverityDescription = (severity: number) => {
    if (severity <= 1) return "Mild – barely noticeable, very manageable";
    if (severity <= 2) return "Light – some awareness but easily controlled";
    if (severity <= 3) return "Moderate – noticeable discomfort but manageable with care";
    if (severity <= 4) return "Significant – considerable discomfort, requires attention";
    return "Severe – intense discomfort, needs immediate management";
  };

  // Group triggers by category
  const groupTriggers = (triggers: any[]) => {
    const grouped: { [key: string]: string[] } = {};
    triggers.forEach(trigger => {
      const category = trigger.category || 'Other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(trigger.name);
    });
    return grouped;
  };

  const groupedTriggers = groupTriggers(episode.triggers);

  // Mock progress data - in real app this would come from user stats
  const episodeCount = 5; // This would be actual count from database

  const handleExport = () => {
    // Generate export content
    const content = `
SweatSmart Episode Summary
Date: ${episode.date}
Severity: ${episode.severity}/5 - ${getSeverityDescription(episode.severity)}
Body Areas: ${episode.bodyAreas.map(area => getBodyAreaLabel(area)).join(', ')}
Triggers: ${episode.triggers.map(t => t.name).join(', ')}
Notes: ${episode.notes || 'None'}
    `.trim();

    // Create downloadable file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sweatsmart-episode-${episode.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = `Just tracked an episode with SweatSmart. Severity: ${episode.severity}/5. Affected areas: ${episode.bodyAreas.map(area => getBodyAreaLabel(area)).join(', ')}. #HyperhidrosisAwareness`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SweatSmart Episode Summary',
          text: shareText,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Episode summary copied to clipboard!');
    }
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
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-sm">
              ✨ <strong>You've logged {episodeCount} episodes this month</strong> — keep going! You're learning your patterns.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Episode Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Episode Summary
            </CardTitle>
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
            <h4 className="font-medium mb-2">Sweating Severity</h4>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {episode.severity}/5
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getSeverityDescription(episode.severity)}
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Affected Areas</h4>
            <div className="flex flex-wrap gap-2">
              {episode.bodyAreas.map((area, index) => (
                <Badge key={index} variant="outline">
                  {getBodyAreaLabel(area)}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Triggers Identified</h4>
            <div className="space-y-3">
              {Object.entries(groupedTriggers).map(([category, triggers]) => (
                <div key={category}>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">
                    {category} Triggers
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {triggers.map((trigger, index) => (
                      <Badge key={index} variant="secondary">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {episode.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{episode.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <section id="insights-recs">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Body Area Insights */}
            {episode.bodyAreas.map((area, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">
                      {getBodyAreaLabel(area)} Area Management
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {area === 'face' && "Use oil-free skincare products and keep cooling wipes handy."}
                      {area === 'palms' && "Consider antiperspirant lotions and keep hands dry with powder."}
                      {area === 'soles' && "Wear moisture-wicking socks and breathable shoes."}
                      {area === 'underarms' && "Use clinical-strength antiperspirants applied to dry skin."}
                      {area === 'head' && "Use dry shampoo and wear breathable hats when needed."}
                      {(area === 'back' || area === 'chest') && "Wear loose, breathable fabrics and consider undershirts."}
                    </p>
                    <div className="text-xs text-primary font-medium">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Next Step: {area === 'face' && "Try 1 cooling wipe before your next social outing."}
                      {area === 'palms' && "Apply hand antiperspirant tonight before bed."}
                      {area === 'soles' && "Change to moisture-wicking socks for tomorrow."}
                      {area === 'underarms' && "Apply antiperspirant to completely dry skin tonight."}
                      {area === 'head' && "Keep a small towel handy for discrete drying."}
                      {(area === 'back' || area === 'chest') && "Switch to a breathable cotton blend shirt."}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => scrollToSection('self-management')}
                >
                  Learn Self-Management Strategies
                </Button>
              </div>
            ))}

            {/* Trigger Insights */}
            {Object.entries(groupedTriggers).map(([category, triggers]) => (
              <div key={category} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">
                      {category} Trigger Management
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {triggers.join(', ')} {triggers.length > 1 ? 'appear' : 'appears'} to be significant triggers for you.
                      {category === 'Environmental' && " Consider pre-cooling strategies and portable fans."}
                      {category === 'Emotional' && " Practice deep breathing and mindfulness techniques."}
                      {category === 'Physical' && " Plan rest breaks and stay hydrated during activity."}
                    </p>
                    <div className="text-xs text-primary font-medium">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Next Step: {category === 'Environmental' && "Carry a portable fan or cooling towel."}
                      {category === 'Emotional' && "Try 1 minute of calm breathing before stressful situations."}
                      {category === 'Physical' && "Schedule a 5-minute cool-down break during activities."}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => scrollToSection('treatment-options')}
                >
                  Explore Treatment Options
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Treatment Options */}
      <section id="treatment-options">
        <Card>
          <CardHeader>
            <CardTitle>Clinical Treatment Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Topical Medications</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Glycopyrrolate cream (0.5-4%) - Qbrexza® wipes</li>
                  <li>• 20% aluminum chloride hexahydrate - Drysol®</li>
                  <li>• 82% sweat reduction reported</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Iontophoresis</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Mild electrical current therapy</li>
                  <li>• &gt;80% reduction after 10-20 sessions</li>
                  <li>• Effective for hands, feet, underarms</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Botox® Injections</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 82-87% sweat reduction</li>
                  <li>• Effects last 3-9 months</li>
                  <li>• FDA-approved treatment</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Microwave Therapy</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• miraDry® FDA-approved</li>
                  <li>• Destroys underarm sweat glands</li>
                  <li>• Durable results reported</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Oral Medications</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Glycopyrrolate, Oxybutynin tablets</li>
                  <li>• Systemic sweat reduction</li>
                  <li>• Side effects: dry mouth, headache</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Surgical Options</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Endoscopic Thoracic Sympathectomy</li>
                  <li>• Reserved for severe cases</li>
                  <li>• Risk of compensatory sweating</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Self-Management Strategies */}
      <section id="self-management">
        <Card>
          <CardHeader>
            <CardTitle>Self-Management Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Clothing & Fabrics</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Loose-fitting, breathable materials</li>
                  <li>• Moisture-wicking synthetic fabrics</li>
                  <li>• Light colors to reflect heat</li>
                  <li>• Layering for easy adjustment</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Stress Management</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Deep breathing exercises</li>
                  <li>• Mindfulness and meditation</li>
                  <li>• Regular exercise routine</li>
                  <li>• Adequate sleep schedule</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Diet & Hydration</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Avoid spicy and hot foods</li>
                  <li>• Limit caffeine and alcohol</li>
                  <li>• Stay well-hydrated</li>
                  <li>• Eat cooling foods (fruits, vegetables)</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Temperature Control</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Use fans and air conditioning</li>
                  <li>• Cold water on wrists and neck</li>
                  <li>• Cooling towels and ice packs</li>
                  <li>• Avoid direct sunlight</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default EpisodeInsights;
