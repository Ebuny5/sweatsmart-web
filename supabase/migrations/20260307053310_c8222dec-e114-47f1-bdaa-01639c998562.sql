
-- Fix: Restrict anonymous UPDATE/DELETE on push_subscriptions to require endpoint ownership

-- Drop the overly permissive anonymous policies
DROP POLICY IF EXISTS "Allow anonymous subscriptions update by endpoint" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow anonymous subscriptions delete" ON public.push_subscriptions;

-- Recreate with endpoint ownership check
CREATE POLICY "Allow anonymous subscriptions update by endpoint"
ON public.push_subscriptions
FOR UPDATE
USING (user_id IS NULL AND endpoint = current_setting('request.header.x-subscription-endpoint', true))
WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous subscriptions delete by endpoint"
ON public.push_subscriptions
FOR DELETE
USING (user_id IS NULL AND endpoint = current_setting('request.header.x-subscription-endpoint', true));
