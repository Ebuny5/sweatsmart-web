import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CommunityPost } from '@/components/community/CommunityPost';
import { UpcomingEvent } from '@/components/community/UpcomingEvent';
import { CommunityBanner } from '@/components/community/CommunityBanner';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const communityPosts = [
  {
    type: 'success' as const,
    tag: 'Success Story',
    author: 'Sarah M.',
    date: 'Sep 30',
    title: 'Finally found relief!',
    body: 'After trying different treatments for years, I finally found a combination that works for me. Clinical strength antiperspirant at night plus iontophoresis...',
    likes: 12,
    comments: 5,
  },
  {
    type: 'question' as const,
    tag: 'Question',
    author: 'Anonymous',
    date: 'Oct 1',
    title: "Going to a job interview tomorrow and I'm so nervous about shaking hands.",
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
    body: "I always carry a small towel or handkerchief in my pocket. It's been a game-changer for confidence in social situations. Also, keeping my hands slightly...",
    likes: 15,
    comments: 8,
  },
];

const upcomingEvents = [
  {
    month: 'OCT',
    day: '09',
    title: 'Monthly Support Group Meeting',
    description: 'Join us for our monthly virtual support group meeting.',
    link: 'https://chat.whatsapp.com/BKgrDMOttm76Jva6fSZUMi?mode=ac_t',
  },
  {
    month: 'OCT',
    day: '15',
    title: 'Treatment Options Workshop',
    description: 'Learn about the latest treatment options with Dr. Smith.',
    link: 'https://chat.whatsapp.com/BKgrDMOttm76Jva6fSZUMi?mode=ac_t',
  },
];

const Community: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert([
          {
            email: email.toLowerCase(),
            user_id: user?.id || null,
            source: 'community_page',
            status: 'active'
          }
        ]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.info('You are already subscribed to our newsletter!');
        } else {
          throw error;
        }
      } else {
        toast.success('Successfully subscribed! Check your email for updates.');
        setEmail('');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground mt-1">
              Connect, share, and support each other
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Share Story
          </Button>
        </div>

        {/* Banner */}
        <CommunityBanner />

        {/* Community Posts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Community Posts
          </h2>
          <div className="space-y-4">
            {communityPosts.map((post, index) => (
              <CommunityPost key={index} {...post} />
            ))}
          </div>
        </div>

        {/* Past Events */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Past Events
          </h2>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <UpcomingEvent key={index} {...event} />
            ))}
          </div>
        </div>

        {/* Upcoming Events - Stay Tuned */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Upcoming Events
          </h2>
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-lg font-medium text-foreground">Stay Tuned</p>
              <p className="text-muted-foreground">
                Subscribe to our newsletter to get updated about current technology in Hyperhidrosis, upcoming events, and foundation updates.
              </p>
              <div className="flex gap-2 max-w-md mx-auto mt-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
                  disabled={isSubscribing}
                  className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <Button onClick={handleSubscribe} disabled={isSubscribing}>
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
};

export default Community;
