-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT DEFAULT 'community_page'
);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin policy: Allow service role to read all subscriptions
CREATE POLICY "Service role can read all subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
TO service_role
USING (true);

-- Public can insert their own subscriptions
CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscriptions
FOR INSERT
TO public
WITH CHECK (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Users can unsubscribe themselves
CREATE POLICY "Users can unsubscribe"
ON public.newsletter_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR email = auth.jwt()->>'email')
WITH CHECK (status = 'unsubscribed');

-- Create index for faster email lookups
CREATE INDEX idx_newsletter_email ON public.newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_status ON public.newsletter_subscriptions(status);