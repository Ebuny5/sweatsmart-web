
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import { MessageSquare, Heart, Calendar, Users } from "lucide-react";

interface CommunityPost {
  id: string;
  user: string;
  content: string;
  type: "success" | "question" | "tip" | "general";
  likes: number;
  comments: number;
  createdAt: Date;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  attendees: number;
}

// Real community data will come from Supabase later
const Community = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getPostTypeColor = (type: CommunityPost["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800";
      case "question":
        return "bg-blue-100 text-blue-800";
      case "tip":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPostTypeLabel = (type: CommunityPost["type"]) => {
    switch (type) {
      case "success":
        return "Success Story";
      case "question":
        return "Question";
      case "tip":
        return "Tip";
      default:
        return "General";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Community</h1>
          <Button>Share Your Story</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Community Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getPostTypeColor(post.type)}>
                            {getPostTypeLabel(post.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            by {post.user}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(post.createdAt, "MMM d")}
                        </span>
                      </div>
                      <p className="text-sm mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes} likes
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.comments} comments
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No community posts yet.</p>
                  <p className="text-sm">Be the first to share your experience!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {event.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {format(event.date, "MMM d, h:mm a")}
                        </span>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.attendees}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events.</p>
                  <p className="text-sm">Check back soon!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Community;
