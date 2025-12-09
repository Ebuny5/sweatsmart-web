-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job for 4-hour reminders (runs at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
SELECT cron.schedule(
  'send-4hour-reminders',
  '0 */4 * * *', -- Every 4 hours at the top of the hour
  $$
  SELECT
    net.http_post(
        url:='https://ujbcolxawpzfjkjviwqw.supabase.co/functions/v1/send-scheduled-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYmNvbHhhd3B6ZmpranZpd3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzY3NjksImV4cCI6MjA2Nzk1Mjc2OX0._wX5hpCparJdq7qzM4hv-PhHr_nfGPHaT2NkazBiPBE"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'send-4hour-reminders';