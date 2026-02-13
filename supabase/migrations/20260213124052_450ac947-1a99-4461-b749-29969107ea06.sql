-- Remove broken cron jobs that can't access the secret
SELECT cron.unschedule('send-4hour-reminders');
SELECT cron.unschedule('climate-alerts-every-30min');
SELECT cron.unschedule('logging-reminders-every-hour');