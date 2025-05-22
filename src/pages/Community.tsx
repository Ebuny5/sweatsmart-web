
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ThumbsUp, Calendar } from "lucide-react";

// Mock community data
const generateMockCommunityData = () => {
  const discussions = [
    {
      id: 1,
      title: "Has anyone tried iontophoresis for palmar hyperhidrosis?",
      author: "SweatingStarfish",
      authorAvatar: "",
      date: "2 days ago",
      content: "I've been dealing with excessively sweaty palms for years and I'm considering trying iontophoresis. Has anyone had success with this treatment? How painful is it? How long did it take to see results?",
      replies: 12,
      likes: 8,
      tags: ["Treatment", "Palms"],
    },
    {
      id: 2,
      title: "Clothing recommendations for social events?",
      author: "DryDreamer",
      authorAvatar: "",
      date: "1 week ago",
      content: "I have an important wedding coming up next month and I'm already anxious about sweating through my clothes. Does anyone have recommendations for clothing materials or specific brands that work well for hiding sweat marks?",
      replies: 24,
      likes: 19,
      tags: ["Lifestyle", "Clothing"],
    },
    {
      id: 3,
      title: "Caffeine definitely triggers my hyperhidrosis",
      author: "CalmAndCool",
      authorAvatar: "",
      date: "3 days ago",
      content: "After tracking my episodes for months, I've confirmed that caffeine is a major trigger for me. I've switched to herbal tea and decaf coffee, and I've seen about a 40% reduction in episodes. Just wanted to share my experience!",
      replies: 15,
      likes: 32,
      tags: ["Triggers", "Diet"],
    },
    {
      id: 4,
      title: "Success with Glycopyrrolate oral medication",
      author: "DripNoMore",
      authorAvatar: "",
      date: "5 days ago",
      content: "After trying everything under the sun, my dermatologist prescribed Glycopyrrolate and it's been life-changing. I wanted to share my experience and see if others have had similar results. I'm taking 2mg twice daily.",
      replies: 18,
      likes: 27,
      tags: ["Treatment", "Medication"],
    },
  ];
  
  const events = [
    {
      id: 1,
      title: "Virtual Q&A with Dr. Maria Johnson, Hyperhidrosis Specialist",
      date: "Jun 15, 2023",
      time: "7:00 PM EDT",
      description: "Join us for a live Q&A session with dermatologist Dr. Maria Johnson, who specializes in treating hyperhidrosis. Come with your questions about treatments and management strategies.",
      attendees: 42,
    },
    {
      id: 2,
      title: "Community Support Group Meeting",
      date: "Jun 22, 2023",
      time: "6:30 PM EDT",
      description: "Our monthly virtual support group meeting where members can share experiences, coping strategies, and provide mutual support in a safe, understanding environment.",
      attendees: 18,
    },
  ];
  
  const resources = [
    {
      id: 1,
      title: "Comprehensive Guide to Hyperhidrosis Treatments",
      source: "International Hyperhidrosis Society",
      type: "Article",
      link: "#",
      description: "An evidence-based overview of all current hyperhidrosis treatments, from antiperspirants to surgery.",
    },
    {
      id: 2,
      title: "Managing Social Anxiety Related to Hyperhidrosis",
      source: "Mental Health Association",
      type: "PDF Guide",
      link: "#",
      description: "Strategies for dealing with the psychological impact of hyperhidrosis, focusing on social anxiety and confidence-building techniques.",
    },
    {
      id: 3,
      title: "Hyperhidrosis and Quality of Life: Recent Research",
      source: "Journal of Dermatology",
      type: "Research Paper",
      link: "#",
      description: "A recent study examining the impact of hyperhidrosis on quality of life and the effectiveness of various interventions.",
    },
  ];
  
  return { discussions, events, resources };
};

const Community = () => {
  const { toast } = useToast();
  const [data, setData] = useState<{
    discussions: any[];
    events: any[];
    resources: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    tags: "",
  });
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(generateMockCommunityData());
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const handleNewPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your post.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Post submitted",
      description: "Your post has been submitted and is pending approval.",
    });
    
    setNewPost({
      title: "",
      content: "",
      tags: "",
    });
  };
  
  if (isLoading || !data) {
    return (
      <AppLayout isAuthenticated={true} userName="John Doe">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Community</h1>
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[200px] animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout isAuthenticated={true} userName="John Doe">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Community</h1>
        
        <Tabs defaultValue="discussions" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="discussions">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-6 md:col-span-2">
                {data.discussions.map((discussion) => (
                  <Card key={discussion.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-lg">{discussion.title}</CardTitle>
                          <CardDescription>
                            Started by {discussion.author} • {discussion.date}
                          </CardDescription>
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={discussion.authorAvatar} />
                          <AvatarFallback>
                            {discussion.author.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-3">{discussion.content}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {discussion.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <div className="flex items-center">
                          <MessageSquare className="mr-1 h-4 w-4" />
                          {discussion.replies} replies
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="mr-1 h-4 w-4" />
                          {discussion.likes} likes
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Read More
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Start a Discussion</CardTitle>
                    <CardDescription>
                      Share your experience or ask a question
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleNewPostSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="Discussion Title"
                          value={newPost.title}
                          onChange={(e) =>
                            setNewPost({ ...newPost, title: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="What's on your mind?"
                          className="min-h-[120px]"
                          value={newPost.content}
                          onChange={(e) =>
                            setNewPost({ ...newPost, content: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Tags (comma separated)"
                          value={newPost.tags}
                          onChange={(e) =>
                            setNewPost({ ...newPost, tags: e.target.value })
                          }
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Post Discussion
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Community Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>• Be respectful and supportive of other members</p>
                    <p>• Do not share personal medical advice</p>
                    <p>• Respect privacy and confidentiality</p>
                    <p>• Stay on topic and avoid promotional content</p>
                    <p>• Report inappropriate content to moderators</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-6 md:col-span-2">
                {data.events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {event.date} at {event.time}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{event.description}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {event.attendees} people attending
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        Add to Calendar
                      </Button>
                      <Button size="sm">RSVP</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                    <CardDescription>
                      Join our community events to learn and connect
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      Our events include Q&A sessions with medical professionals,
                      support group meetings, and educational webinars.
                    </p>
                    <p className="text-sm">
                      Have an idea for an event? Let us know!
                    </p>
                    <Button variant="outline" className="w-full">
                      Suggest an Event
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="resources">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-6 md:col-span-2">
                {data.resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader>
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <CardDescription>
                            {resource.source}
                          </CardDescription>
                        </div>
                        <Badge>{resource.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{resource.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(resource.link, "_blank")}
                      >
                        View Resource
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Directory</CardTitle>
                    <CardDescription>
                      Helpful information from trusted sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium">Organizations</h3>
                      <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
                        <li>International Hyperhidrosis Society</li>
                        <li>American Academy of Dermatology</li>
                        <li>SweatHelp.org</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium">Find a Specialist</h3>
                      <p className="text-sm mt-2">
                        Looking for a healthcare provider who specializes in
                        hyperhidrosis?
                      </p>
                      <Button variant="link" className="p-0 h-auto text-sm">
                        Find a specialist near you
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Community;
