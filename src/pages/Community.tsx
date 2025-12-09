import React from 'react';
import { Heart, MessageCircle, Calendar, Users, Edit, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';

interface CommunityPost {
  id: number;
  type: 'success' | 'question' | 'tip';
  tag: string;
  author: string;
  date: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
}

const communityPosts: CommunityPost[] = [
  {
    id: 1,
    type: 'success',
    tag: 'Success Story',
    author: 'Sarah M.',
    date: 'Sep 30',
    title: 'Finally found relief!',
    body: 'After trying different treatments for years, I finally found a combination that works for me...',
    likes: 12,
    comments: 5,
  },
  {
    id: 2,
    type: 'question',
    tag: 'Question',
    author: 'Mike T.',
    date: 'Sep 29',
    title: 'Best fabrics for summer?',
    body: 'Looking for recommendations on breathable fabrics that help manage sweating during hot weather...',
    likes: 8,
    comments: 12,
  },
  {
    id: 3,
    type: 'tip',
    tag: 'Tip',
    author: 'Emma R.',
    date: 'Sep 28',
    title: 'Meal timing trick',
    body: 'I discovered that eating smaller, more frequent meals helps reduce my sweating episodes...',
    likes: 24,
    comments: 7,
  },
];

const getTagStyles = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-community-success-bg text-community-success';
    case 'question':
      return 'bg-community-question-bg text-community-question';
    case 'tip':
      return 'bg-community-tip-bg text-community-tip';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const Community: React.FC = () => {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-background dark:from-slate-900 dark:to-background">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Community</h1>
            <Button className="bg-community-purple hover:bg-community-purple/90 text-white rounded-full px-4 py-2 text-sm font-medium">
              <Edit className="w-4 h-4 mr-2" />
              Share Story
            </Button>
          </div>

          {/* Support Group Banner */}
          <div className="bg-community-purple/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-community-purple/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-community-purple" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-base">Join Our Support Group</h3>
              <p className="text-sm text-muted-foreground">Connect with others who understand</p>
            </div>
            <Button 
              variant="outline" 
              className="border-community-purple text-community-purple hover:bg-community-purple hover:text-white rounded-full px-4 py-1 text-sm font-medium"
            >
              Join Now
            </Button>
          </div>

          {/* Community Posts Card */}
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Community Posts</h2>
              
              {/* Posts List */}
              <div className="space-y-4">
                {communityPosts.map((post) => (
                  <div key={post.id} className="space-y-2">
                    {/* Tag and Meta */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagStyles(post.type)}`}>
                        {post.tag}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {post.author} • {post.date}
                      </span>
                    </div>
                    
                    {/* Title and Body */}
                    <div>
                      <h3 className="font-medium text-foreground text-sm">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <button className="flex items-center gap-1 text-xs hover:text-community-purple transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-xs hover:text-community-purple transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                    </div>
                    
                    {/* Divider between posts */}
                    {post.id !== communityPosts.length && (
                      <div className="border-b border-border/50 pt-2" />
                    )}
                  </div>
                ))}
              </div>

              {/* Upcoming Events Section */}
              <div className="pt-2 border-t border-border/50">
                <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming Events</h2>
                
                <div className="flex items-start gap-3">
                  {/* Date Box */}
                  <div className="w-14 h-14 rounded-xl bg-community-purple flex flex-col items-center justify-center text-white flex-shrink-0">
                    <span className="text-xs font-medium uppercase">Oct</span>
                    <span className="text-xl font-bold leading-none">15</span>
                  </div>
                  
                  {/* Event Details */}
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm">Virtual Support Meeting</h3>
                    <p className="text-xs text-muted-foreground">Weekly group discussion and tips sharing session</p>
                  </div>
                  
                  {/* Join Button */}
                  <Button 
                    size="sm"
                    className="bg-community-purple hover:bg-community-purple/90 text-white rounded-full px-4 text-xs font-medium"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Community;
