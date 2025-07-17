
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format, subDays } from "date-fns";
import { MessageSquare, Heart, Calendar, Users, Plus, ExternalLink, Video, Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface CommunityPost {
  id: string;
  user: string;
  content: string;
  title?: string;
  type: "success" | "question" | "tip" | "general";
  likes: number;
  comments: number;
  createdAt: Date;
  isAnonymous: boolean;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  attendees: number;
  link?: string;
}

const storySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(10, "Story must be at least 10 characters long"),
  isAnonymous: z.boolean().default(false),
});

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  link: z.string().url().optional().or(z.literal("")),
});

const Community = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showStoryDialog, setShowStoryDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const { user } = useAuth();

  // Check if user is admin (you can adjust this logic based on your user roles)
  const isAdmin = user?.email === "admin@beyondsweat.life"; // Replace with your admin email

  const storyForm = useForm<z.infer<typeof storySchema>>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: "",
      content: "",
      isAnonymous: false,
    },
  });

  const eventForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      link: "",
    },
  });

  // Mock data for now - replace with actual Supabase queries
  useEffect(() => {
    // Mock posts
    setPosts([
      {
        id: "1",
        user: "Sarah M.",
        title: "Finally found relief!",
        content: "After trying different treatments for years, I finally found a combination that works for me. Clinical-strength antiperspirant at night plus iontophoresis treatments have reduced my palm sweating by about 80%. Don't give up hope!",
        type: "success",
        likes: 12,
        comments: 5,
        createdAt: subDays(new Date(), 2),
        isAnonymous: false,
      },
      {
        id: "2",
        user: "Anonymous",
        title: "",
        content: "Going to a job interview tomorrow and I'm so nervous about shaking hands. Any quick tips for managing palm sweating in the moment?",
        type: "question",
        likes: 8,
        comments: 15,
        createdAt: subDays(new Date(), 1),
        isAnonymous: true,
      },
    ]);

    // Mock events
    setEvents([
      {
        id: "1",
        title: "Monthly Support Group Meeting",
        description: "Join us for our monthly virtual support group where we share experiences and tips.",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        attendees: 23,
        link: "https://zoom.us/example",
      },
    ]);
  }, []);

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

  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const onSubmitStory = async (values: z.infer<typeof storySchema>) => {
    try {
      const newPost: CommunityPost = {
        id: Date.now().toString(),
        user: values.isAnonymous ? "Anonymous" : user?.email?.split('@')[0] || "User",
        title: values.title || "",
        content: values.content,
        type: "general",
        likes: 0,
        comments: 0,
        createdAt: new Date(),
        isAnonymous: values.isAnonymous,
      };

      setPosts([newPost, ...posts]);
      setShowStoryDialog(false);
      storyForm.reset();
      toast({
        title: "Story shared!",
        description: "Thank you for sharing your experience with the community.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share your story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmitEvent = async (values: z.infer<typeof eventSchema>) => {
    try {
      const newEvent: CommunityEvent = {
        id: Date.now().toString(),
        title: values.title,
        description: values.description,
        date: new Date(values.date),
        attendees: 0,
        link: values.link || undefined,
      };

      setEvents([...events, newEvent]);
      setShowEventDialog(false);
      eventForm.reset();
      toast({
        title: "Event created!",
        description: "Your event has been added to the community calendar.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Community</h1>
          <Dialog open={showStoryDialog} onOpenChange={setShowStoryDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Share Your Story
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Share Your Story</DialogTitle>
              </DialogHeader>
              <Form {...storyForm}>
                <form onSubmit={storyForm.handleSubmit(onSubmitStory)} className="space-y-4">
                  <FormField
                    control={storyForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Give your story a title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={storyForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Story *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your experience, tips, or ask for support..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={storyForm.control}
                    name="isAnonymous"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Post Anonymously</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Your name won't be shown with this post
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowStoryDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Share Story</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* WhatsApp Community Link */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Join Our WhatsApp Support Group</h3>
                  <p className="text-sm text-green-700">
                    Connect with others, share experiences, and get real-time support from the Beyond Sweat Foundation community.
                  </p>
                </div>
              </div>
              <Button 
                asChild
                className="bg-green-600 hover:bg-green-700"
              >
                <a 
                  href="https://chat.whatsapp.com/Jf0GRQRHhWrKiyzhGQm3wg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Now
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

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
                      {post.title && (
                        <h4 className="font-medium mb-2">{post.title}</h4>
                      )}
                      <div className="text-sm mb-3">
                        {expandedPosts.has(post.id) || post.content.length <= 150 ? (
                          <p>{post.content}</p>
                        ) : (
                          <p>
                            {post.content.substring(0, 150)}...
                            <button
                              onClick={() => togglePostExpansion(post.id)}
                              className="text-primary hover:underline ml-1"
                            >
                              Read More
                            </button>
                          </p>
                        )}
                        {expandedPosts.has(post.id) && post.content.length > 150 && (
                          <button
                            onClick={() => togglePostExpansion(post.id)}
                            className="text-primary hover:underline mt-1 block"
                          >
                            Show Less
                          </button>
                        )}
                      </div>
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

          <div className="space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                  {isAdmin && (
                    <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Event</DialogTitle>
                        </DialogHeader>
                        <Form {...eventForm}>
                          <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="space-y-4">
                            <FormField
                              control={eventForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Event Title *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Event title..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={eventForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description *</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Event description..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={eventForm.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date & Time *</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={eventForm.control}
                              name="link"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Link (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="outline" onClick={() => setShowEventDialog(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">Create Event</Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
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
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">
                            {format(event.date, "MMM d, h:mm a")}
                          </span>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendees}
                          </div>
                        </div>
                        {event.link && (
                          <Button asChild size="sm" variant="outline" className="w-full">
                            <a href={event.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Join Event
                            </a>
                          </Button>
                        )}
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

            {/* Resources Panel (Admin Only) */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Video className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">YouTube Video Embed</p>
                        <p className="text-xs">(Admin can configure)</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <a href="https://www.beyondsweat.life" target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Visit BeyondSweat.life
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Community;
