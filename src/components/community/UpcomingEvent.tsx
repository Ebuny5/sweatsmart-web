import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UpcomingEventProps {
  month: string;
  day: string;
  title: string;
  description: string;
}

export const UpcomingEvent: React.FC<UpcomingEventProps> = ({
  month,
  day,
  title,
  description,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg p-3 min-w-[70px]">
          <div className="text-xs font-semibold uppercase">{month}</div>
          <div className="text-2xl font-bold">{day}</div>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button size="sm">Join</Button>
      </CardContent>
    </Card>
  );
};
