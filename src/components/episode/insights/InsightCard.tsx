
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface InsightCardProps {
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

const InsightCard: React.FC<InsightCardProps> = ({
  icon,
  title,
  summary,
  details,
  actions,
  confidence,
  evidenceTag,
  borderColor,
  bgColor,
}) => {
  const confidenceColors = {
    Low: 'bg-orange-100 text-orange-800 border-orange-200',
    Medium: 'bg-blue-100 text-blue-800 border-blue-200',
    High: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <Card className={`border-l-4 ${borderColor} ${bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <Badge className={`text-xs ${confidenceColors[confidence]}`}>
            {confidence}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{summary}</p>
          <p className="text-xs text-muted-foreground">{details}</p>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">IMMEDIATE ACTION</h4>
          <p className="text-sm bg-green-50 p-3 rounded-lg border-l-4 border-l-green-500 text-green-800">
            {actions.immediate}
          </p>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">SELF-MANAGEMENT</h4>
          <p className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-500 text-blue-800">
            {actions.selfManagement}
          </p>
        </div>
        
        <div className="pt-2 border-t space-y-2">
          <p className="text-xs text-muted-foreground">
            Evidence: {evidenceTag}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              Learn More
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Export for Clinician
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightCard;
