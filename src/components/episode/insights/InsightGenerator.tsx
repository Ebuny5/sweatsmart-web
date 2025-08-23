
import React from 'react';
import { ProcessedEpisode } from '@/types';
import { 
  Target, 
  Activity,
  Thermometer,
  Heart,
  AlertTriangle
} from 'lucide-react';
import InsightCard from './InsightCard';

interface InsightGeneratorProps {
  episode: ProcessedEpisode;
}

interface GeneratedInsight {
  type: 'trigger' | 'bodyArea' | 'severity';
  icon: React.ReactNode;
  title: string;
  summary: string;
  details: string;
  actions: {
    immediate: string;
    selfManagement: string;
  };
  confidence: 'Low' | 'Medium' | 'High';
  evidenceTag: string;
  borderColor: string;
  bgColor: string;
}

const InsightGenerator: React.FC<InsightGeneratorProps> = ({ episode }) => {
  const generateInsights = (): GeneratedInsight[] => {
    const insights: GeneratedInsight[] = [];
    
    // Severity-based insights
    if (episode.severityLevel >= 4) {
      insights.push({
        type: 'severity',
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        title: 'High Severity Episode',
        summary: `This was a high-severity episode (${episode.severityLevel}/5) that may have interfered with daily activities.`,
        details: 'High-severity episodes often indicate strong triggers or systemic responses. Consider tracking environmental and emotional factors more closely.',
        actions: {
          immediate: 'Move to a cool, comfortable environment and use cooling products if available.',
          selfManagement: 'Review recent activities, foods, and stressors that preceded this episode to identify patterns.'
        },
        confidence: 'High',
        evidenceTag: 'User-reported severity scale',
        borderColor: 'border-l-red-500',
        bgColor: 'bg-red-50/50'
      });
    }

    // Body area insights
    if (episode.bodyAreas.length > 2) {
      const areaList = episode.bodyAreas.join(', ');
      insights.push({
        type: 'bodyArea',
        icon: <Activity className="h-5 w-5 text-blue-600" />,
        title: 'Multiple Body Areas Affected',
        summary: `${episode.bodyAreas.length} body areas were affected: ${areaList}.`,
        details: 'When multiple areas sweat simultaneously, it often indicates a systemic trigger like stress, heat, or hormonal changes rather than localized causes.',
        actions: {
          immediate: 'Use cooling techniques for all affected areas and wear breathable, moisture-wicking clothing.',
          selfManagement: 'Track environmental temperature, stress levels, and dietary triggers before episodes.'
        },
        confidence: 'Medium',
        evidenceTag: 'Multi-area pattern analysis',
        borderColor: 'border-l-blue-500',
        bgColor: 'bg-blue-50/50'
      });
    }

    // Trigger insights - deduplicate and humanize
    const uniqueTriggers = new Map<string, any>();
    episode.triggers.forEach(trigger => {
      const key = trigger.type + '_' + trigger.value;
      if (!uniqueTriggers.has(key)) {
        uniqueTriggers.set(key, trigger);
      }
    });

    uniqueTriggers.forEach(trigger => {
      if (trigger.type === 'environmental') {
        const humanizedTrigger = humanizeTrigger(trigger);
        insights.push({
          type: 'trigger',
          icon: <Thermometer className="h-5 w-5 text-orange-600" />,
          title: `Primary Trigger — ${humanizedTrigger.label}`,
          summary: `Environmental factors played a role in this episode.`,
          details: `${humanizedTrigger.description} Consider adjusting your environment when possible.`,
          actions: {
            immediate: humanizedTrigger.immediateAction,
            selfManagement: humanizedTrigger.selfManagement
          },
          confidence: 'Medium',
          evidenceTag: 'Environmental trigger detection',
          borderColor: 'border-l-orange-500',
          bgColor: 'bg-orange-50/50'
        });
      } else if (trigger.type === 'emotional') {
        const humanizedTrigger = humanizeTrigger(trigger);
        insights.push({
          type: 'trigger',
          icon: <Heart className="h-5 w-5 text-pink-600" />,
          title: `Primary Trigger — ${humanizedTrigger.label}`,
          summary: `Emotional factors contributed to this episode.`,
          details: `${humanizedTrigger.description} Managing stress and emotional responses can help reduce episode frequency.`,
          actions: {
            immediate: humanizedTrigger.immediateAction,
            selfManagement: humanizedTrigger.selfManagement
          },
          confidence: 'Medium',
          evidenceTag: 'Emotional trigger detection',
          borderColor: 'border-l-pink-500',
          bgColor: 'bg-pink-50/50'
        });
      }
    });

    return insights;
  };

  const humanizeTrigger = (trigger: any) => {
    const value = trigger.value?.toLowerCase() || '';
    
    if (value.includes('hot') || value.includes('temperature')) {
      return {
        label: 'Heat / Hot Environments',
        description: 'High temperatures or poorly ventilated spaces triggered excessive sweating.',
        immediateAction: 'Move to a cool environment and use cooling wipes or a fan.',
        selfManagement: 'Wear breathable clothes and avoid peak heat hours when possible.'
      };
    } else if (value.includes('stress') || value.includes('anxiety')) {
      return {
        label: 'Stress / Anxiety',
        description: 'Emotional stress or anxiety activated your sympathetic nervous system.',
        immediateAction: 'Practice deep breathing exercises to activate your parasympathetic response.',
        selfManagement: 'Consider regular meditation, yoga, or stress management techniques.'
      };
    } else if (value.includes('crowd') || value.includes('social')) {
      return {
        label: 'Crowded / Social Environments',
        description: 'Social situations or crowded spaces may have triggered anxiety-related sweating.',
        immediateAction: 'Step away to a quieter area and practice grounding techniques.',
        selfManagement: 'Prepare coping strategies before social events and practice gradual exposure.'
      };
    } else {
      return {
        label: trigger.label || 'Environmental Factor',
        description: 'An environmental or situational factor contributed to this episode.',
        immediateAction: 'Remove yourself from the triggering situation if possible.',
        selfManagement: 'Track this pattern to better prepare for similar situations.'
      };
    }
  };

  const insights = generateInsights();

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <InsightCard
          key={`${insight.type}-${index}`}
          icon={insight.icon}
          title={insight.title}
          summary={insight.summary}
          details={insight.details}
          actions={insight.actions}
          confidence={insight.confidence}
          evidenceTag={insight.evidenceTag}
          borderColor={insight.borderColor}
          bgColor={insight.bgColor}
        />
      ))}
    </div>
  );
};

export default InsightGenerator;
