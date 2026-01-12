-- Create table for storing push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  temperature_threshold DOUBLE PRECISION DEFAULT 24,
  humidity_threshold DOUBLE PRECISION DEFAULT 70,
  uv_threshold DOUBLE PRECISION DEFAULT 6,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Allow anonymous subscriptions (for users not logged in)
CREATE POLICY "Allow anonymous subscriptions insert"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous subscriptions by endpoint"
  ON public.push_subscriptions FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Allow anonymous subscriptions update by endpoint"
  ON public.push_subscriptions FOR UPDATE
  USING (user_id IS NULL);

CREATE POLICY "Allow anonymous subscriptions delete"
  ON public.push_subscriptions FOR DELETE
  USING (user_id IS NULL);

-- Service role needs access for the cron job
CREATE POLICY "Service role full access"
  ON public.push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();