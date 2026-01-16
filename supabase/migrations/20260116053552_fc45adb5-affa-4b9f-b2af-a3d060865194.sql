-- Fix overly permissive newsletter_subscriptions SELECT policy
-- The current policy allows any authenticated user to read all subscriptions
-- This should only be accessible by service_role

DROP POLICY IF EXISTS "Service role can read all subscriptions" ON newsletter_subscriptions;

CREATE POLICY "Service role can read all subscriptions"
  ON newsletter_subscriptions FOR SELECT
  USING (auth.role() = 'service_role');