import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Edit } from "lucide-react";

const communityPosts = [
  {
    type: 'success' as const,
    tag: 'Success Story',
    author: 'Sarah M.',
    date: 'Sep 30',
    title: 'Finally found relief!',
    body: 'After trying different treatments for years, I finally found a combination that works for me. Clinical strength antiperspirant at night plus iontophor...',
    likes: 12,
    comments: 5,
  },
  {
    type: 'question' as const,
    tag: 'Question',
    author: 'Anonymous',
    date: 'Oct 1',
    title: 'Going to a job interview tomorrow and I\'m so nervous about shaking hands.',
    body: 'Any quick tips for managing palm sweating in the moment?',
    likes: 8,
    comments: 15,
  },
  {
    type: 'tip' as const,
    tag: 'Tip',
    author: 'Mike T.',
    date: 'Sep 29',
    title: 'Great tip for social situations',
    body: 'I always carry a small towel or handkerchief in my pocket. It\'s been a game-changer for confidence in social situations. Also, keeping my hands slight...',
    likes: 15,
    comments: 8,
  },
];

const Community = () => {
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());

  const togglePostExpansion = (index: number) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPosts(newExpanded);
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'question':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'tip':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Community</h1>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Share Story
          </Button>
        </div>

        {/* WhatsApp Support Group Banner */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Join Our Support Group</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Connect with others, share experiences, and get real-time support.</p>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              Join Now
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Community Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {communityPosts.map((post, index) => (
              <div key={index} className="border-b last:border-0 pb-6 last:pb-0">
                <div className="flex items-start gap-2 mb-2">
                  <Badge className={getPostTypeColor(post.type)}>
                    {post.tag}
                  </Badge>
                </div>
                <h4 className="font-semibold text-lg mb-1">{post.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  by {post.author} • {post.date}
                </p>
                <p className="text-sm mb-4">
                  {post.body}{' '}
                  <button 
                    onClick={() => togglePostExpansion(index)}
                    className="text-primary hover:underline"
                  >
                    Read More
                  </button>
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    <Heart className="h-4 w-4" />
                    {post.likes} likes
                  </button>
                  <button className="flex items-center gap-1 hover:text-foreground">
                    <MessageSquare className="h-4 w-4" />
                    {post.comments} comments
                  </button>
                </div>
              </div>
            ))}

            {/* Divider */}
            <div className="border-t my-6" />

            {/* Upcoming Events */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
              <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="text-center bg-primary/10 rounded-lg p-3 min-w-[70px]">
                  <div className="text-xs font-medium text-primary">OCT</div>
                  <div className="text-2xl font-bold text-primary">09</div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Monthly Support Group Meeting</h4>
                  <p className="text-sm text-muted-foreground">
                    Join us for our monthly virtual support group meeting.
                  </p>
                </div>
                <Button size="sm">Join</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Community;
