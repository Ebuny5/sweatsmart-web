import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const CommunityBanner: React.FC = () => {
  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary">
          <Users className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            Join Our Support Group
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect with others, share experiences, and get real-time support.
          </p>
        </div>
        <Button>Join Now</Button>
      </CardContent>
    </Card>
  );
};
