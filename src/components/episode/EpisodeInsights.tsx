
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, MapPin, Zap, Heart, Utensils, Activity, ThermometerSun, User } from 'lucide-react';
import { ProcessedEpisode, BodyArea, Trigger } from '@/types';

interface EpisodeInsightsProps {
  episode: ProcessedEpisode;
}

// Body area configurations with enhanced descriptions
const bodyAreaConfig: Record<BodyArea, { label: string; icon: React.ReactNode; description: string; recommendation: string }> = {
  palms: {
    label: 'Palms',
    icon: <User className="h-4 w-4" />,
    description: 'Noticeable clamminess and grip issues',
    recommendation: 'Use iontophoresis or hand-specific antiperspirant nightly; carry grip pads if needed'
  },
  soles: {
    label: 'Feet',
    icon: <User className="h-4 w-4" />,
    description: 'Shoes felt saturated',
    recommendation: 'Rotate between two pairs of moisture-absorbing insoles; air out shoes between wears'
  },
  face: {
    label: 'Face',
    icon: <User className="h-4 w-4" />,
    description: 'Light sheen, occasional drips',
    recommendation: 'Apply oil-free, non-comedogenic mattifying lotion; keep cooling facial wipes on hand'
  },
  armpits: {
    label: 'Underarms',
    icon: <User className="h-4 w-4" />,
    description: 'Consistent dampness after 10 minutes',
    recommendation: 'Re-apply clinical-strength antiperspirant at night; wear moisture-wicking, breathable fabric'
  },
  head: {
    label: 'Head/Scalp',
    icon: <User className="h-4 w-4" />,
    description: 'Scalp moisture and hair dampness',
    recommendation: 'Use dry shampoo between washes; keep a cooling towel nearby during episodes'
  },
  back: {
    label: 'Back',
    icon: <User className="h-4 w-4" />,
    description: 'Shirt dampness and discomfort',
    recommendation: 'Wear moisture-wicking base layers; use a small fan or cooling pad when possible'
  },
  groin: {
    label: 'Groin',
    icon: <User className="h-4 w-4" />,
    description: 'Lower body discomfort and dampness',
    recommendation: 'Choose breathable, moisture-wicking underwear; consider antifungal powder for comfort'
  },
  entireBody: {
    label: 'Entire Body',
    icon: <User className="h-4 w-4" />,
    description: 'Widespread sweating affecting multiple areas',
    recommendation: 'Focus on overall cooling strategies; consider consultation with dermatologist for systemic treatment'
  },
  other: {
    label: 'Other Areas',
    icon: <User className="h-4 w-4" />,
    description: 'Additional affected areas',
    recommendation: 'Monitor patterns and discuss specific area management with healthcare provider'
  }
};

// Trigger configurations with enhanced descriptions
const triggerConfig: Record<string, { icon: React.ReactNode; description: string; recommendation: string }> = {
  'stress': {
    icon: <Heart className="h-4 w-4" />,
    description: 'Heart rate spikes preceded sweating',
    recommendation: 'Practice 3-minute breathing or mindfulness breaks when anxious; try progressive muscle relaxation'
  },
  'anxiety': {
    icon: <Heart className="h-4 w-4" />,
    description: 'Anxiety-related sweating episode',
    recommendation: 'Develop pre-emptive coping strategies; consider anxiety management techniques'
  },
  'spicyFood': {
    icon: <Utensils className="h-4 w-4" />,
    description: 'Spicy/hot foods consumed before episode',
    recommendation: 'Keep a food diary to pinpoint problem items; avoid known spicy triggers before high-stress events'
  },
  'physicalExercise': {
    icon: <Activity className="h-4 w-4" />,
    description: 'Brief walk or physical activity',
    recommendation: 'Wear breathable footwear and socks; cool down immediately after exertion with fan or cold pack'
  },
  'hotTemperature': {
    icon: <ThermometerSun className="h-4 w-4" />,
    description: 'High ambient temperature trigger',
    recommendation: 'Pre-cool before entering warm environments; carry portable cooling devices'
  },
  'caffeine': {
    icon: <Utensils className="h-4 w-4" />,
    description: 'Caffeine consumption triggered episode',
    recommendation: 'Monitor caffeine intake timing; consider reducing consumption before important events'
  }
};

const getSeverityLabel = (severity: number): { label: string; color: string } => {
  if (severity <= 1) return { label: 'Mild', color: 'bg-green-100 text-green-800' };
  if (severity <= 2) return { label: 'Light', color: 'bg-yellow-100 text-yellow-800' };
  if (severity <= 3) return { label: 'Moderate', color: 'bg-orange-100 text-orange-800' };
  if (severity <= 4) return { label: 'Severe', color: 'bg-red-100 text-red-800' };
  return { label: 'Extreme', color: 'bg-red-200 text-red-900' };
};

const EpisodeInsights: React.FC<EpisodeInsightsProps> = ({ episode }) => {
  // Deduplicate body areas
  const uniqueBodyAreas = Array.from(new Set(episode.bodyAreas));
  
  // Deduplicate triggers by value
  const uniqueTriggers = episode.triggers.reduce((acc, trigger) => {
    const existing = acc.find(t => t.value === trigger.value);
    if (!existing) {
      acc.push(trigger);
    }
    return acc;
  }, [] as Trigger[]);

  const severityInfo = getSeverityLabel(episode.severityLevel);

  return (
    <div className="space-y-6">
      {/* Immediate Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            🕵️‍♀️ Immediate Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Severity */}
          <div className="flex items-center gap-3">
            <span className="font-medium">Overall Sweating Severity:</span>
            <Badge className={severityInfo.color}>
              {severityInfo.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({episode.severityLevel}/5 intensity)
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your episode was rated {episode.severityLevel}/5 in intensity
            {episode.severityLevel >= 3 ? '—enough to interfere with daily activities.' : '—manageable with basic interventions.'}
          </p>

          {/* Body Areas Affected */}
          {uniqueBodyAreas.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Body Areas Affected
              </h4>
              <div className="space-y-2">
                {uniqueBodyAreas.map((area) => {
                  const config = bodyAreaConfig[area];
                  return (
                    <div key={area} className="flex items-start gap-2 text-sm">
                      {config.icon}
                      <div>
                        <span className="font-medium">{config.label}:</span>
                        <span className="ml-1 text-muted-foreground">{config.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Triggers Identified */}
          {uniqueTriggers.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Triggers Identified
              </h4>
              <div className="space-y-2">
                {uniqueTriggers.map((trigger) => {
                  const config = triggerConfig[trigger.value] || {
                    icon: <Zap className="h-4 w-4" />,
                    description: `${trigger.label} detected`,
                    recommendation: 'Monitor this trigger and note patterns for future episodes'
                  };
                  return (
                    <div key={trigger.value} className="flex items-start gap-2 text-sm">
                      {config.icon}
                      <div>
                        <span className="font-medium">{trigger.label}:</span>
                        <span className="ml-1 text-muted-foreground">{config.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actionable Recommendations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            💡 Actionable Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Body Area Recommendations */}
          {uniqueBodyAreas.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Area-Specific Tips
              </h4>
              <div className="space-y-3">
                {uniqueBodyAreas.map((area) => {
                  const config = bodyAreaConfig[area];
                  return (
                    <div key={area} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        {config.icon}
                        <span className="font-medium text-sm">{config.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{config.recommendation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trigger Recommendations */}
          {uniqueTriggers.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Trigger Management
              </h4>
              <div className="space-y-3">
                {uniqueTriggers.map((trigger) => {
                  const config = triggerConfig[trigger.value] || {
                    icon: <Zap className="h-4 w-4" />,
                    description: `${trigger.label} detected`,
                    recommendation: 'Monitor this trigger and note patterns for future episodes'
                  };
                  return (
                    <div key={trigger.value} className="border-l-4 border-amber-200 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        {config.icon}
                        <span className="font-medium text-sm">{trigger.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{config.recommendation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Episode Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="text-center text-sm font-medium">
              <span className="text-muted-foreground">Episode Summary: </span>
              <span>Severity {episode.severityLevel}/5</span>
              <span className="mx-2">•</span>
              <span>{uniqueBodyAreas.length} body area{uniqueBodyAreas.length !== 1 ? 's' : ''} affected</span>
              <span className="mx-2">•</span>
              <span>{uniqueTriggers.length} unique trigger{uniqueTriggers.length !== 1 ? 's' : ''} identified</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EpisodeInsights;
