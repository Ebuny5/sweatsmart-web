-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Climate alerts every 30 minutes
SELECT cron.schedule(
  'climate-alerts-every-30min',
  '*/30 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://ujbcolxawpzfjkjviwqw.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{"action":"send_climate_alerts"}'::jsonb
  );
  $$
);

-- Logging reminders every hour
SELECT cron.schedule(
  'logging-reminders-every-hour',
  '0 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://ujbcolxawpzfjkjviwqw.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{"action":"send_logging_reminders"}'::jsonb
  );
  $$
);