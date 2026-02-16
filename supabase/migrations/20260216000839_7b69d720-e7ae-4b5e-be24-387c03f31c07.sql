
-- Table to track notification send counts per user per day for rate limiting
CREATE TABLE public.notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'logging_reminder', 'climate_moderate', 'climate_extreme'
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_date date NOT NULL DEFAULT CURRENT_DATE
);

-- Index for fast lookups by subscription + date + type
CREATE INDEX idx_notification_log_sub_date ON public.notification_log (subscription_id, created_date, notification_type);
CREATE INDEX idx_notification_log_user_date ON public.notification_log (user_id, created_date, notification_type);

-- Enable RLS
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Service role full access (only edge function writes here)
CREATE POLICY "Service role full access" ON public.notification_log FOR ALL USING (auth.role() = 'service_role'::text);

-- Add last_reminder_sent_at to push_subscriptions for tracking per-sub reminder timing
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamp with time zone;
