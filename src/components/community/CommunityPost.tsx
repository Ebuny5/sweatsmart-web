import React from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommunityPostProps {
  type: 'success' | 'question' | 'tip';
  tag: string;
  author: string;
  date: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
}

const postTypeStyles = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  question: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  tip: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export const CommunityPost: React.FC<CommunityPostProps> = ({
  type,
  tag,
  author,
  date,
  title,
  body,
  likes,
  comments,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <Badge className={cn('mb-3', postTypeStyles[type])}>
          {tag}
        </Badge>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          by {author} • {date}
        </p>
        <p className="text-foreground mb-4">
          {body}{' '}
          <a href="#" className="text-primary hover:underline font-medium">
            Read More
          </a>
        </p>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 hover:text-primary cursor-pointer transition-colors">
            <Heart className="h-4 w-4" />
            {likes} likes
          </span>
          <span className="flex items-center gap-2 hover:text-primary cursor-pointer transition-colors">
            <MessageSquare className="h-4 w-4" />
            {comments} comments
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
