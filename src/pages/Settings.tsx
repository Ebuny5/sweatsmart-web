
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { Loader2, Bell, Clock, Youtube, Globe, AlertTriangle } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const { settings, loading, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    daily_reminders: true,
    reminder_time: '08:00',
    trigger_alerts: true,
    data_sharing: false,
    youtube_url: '',
    website_url: ''
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        daily_reminders: settings.daily_reminders ?? true,
        reminder_time: settings.reminder_time ?? '08:00',
        trigger_alerts: settings.trigger_alerts ?? true,
        data_sharing: settings.data_sharing ?? false,
        youtube_url: settings.youtube_url ?? '',
        website_url: settings.website_url ?? ''
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const success = await updateSettings(localSettings);

      if (success) {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully.",
        });

        // Schedule notifications if enabled
        if (localSettings.daily_reminders || localSettings.trigger_alerts) {
          scheduleNotifications();
        }
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const scheduleNotifications = () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({
            title: "Notifications enabled",
            description: "You'll receive reminders based on your settings.",
          });
        }
      });
    }

    // Set up daily reminder if enabled
    if (localSettings.daily_reminders) {
      const [hours, minutes] = localSettings.reminder_time.split(':');
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('SweatSmart Reminder', {
            body: 'Time to log your hyperhidrosis episode!',
            icon: '/favicon.ico'
          });
        }
        
        // Set up daily recurring notification
        setInterval(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('SweatSmart Reminder', {
              body: 'Time to log your hyperhidrosis episode!',
              icon: '/favicon.ico'
            });
          }
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, timeUntilReminder);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your reminder and alert preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Daily Reminders</Label>
                  <div className="text-[0.8rem] text-muted-foreground">
                    Get reminded to log your episodes daily
                  </div>
                </div>
                <Switch
                  checked={localSettings.daily_reminders}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({ ...prev, daily_reminders: checked }))
                  }
                />
              </div>

              {localSettings.daily_reminders && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Reminder Time
                  </Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={localSettings.reminder_time}
                    onChange={(e) =>
                      setLocalSettings(prev => ({ ...prev, reminder_time: e.target.value }))
                    }
                    className="w-40"
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Trigger Alerts</Label>
                  <div className="text-[0.8rem] text-muted-foreground">
                    Get notified when potential triggers are detected
                  </div>
                </div>
                <Switch
                  checked={localSettings.trigger_alerts}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({ ...prev, trigger_alerts: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Share Your Story
              </CardTitle>
              <CardDescription>
                Help the hyperhidrosis community by sharing your experience and resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-600" />
                  YouTube Video URL
                </Label>
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={localSettings.youtube_url}
                  onChange={(e) =>
                    setLocalSettings(prev => ({ ...prev, youtube_url: e.target.value }))
                  }
                />
                <div className="text-[0.8rem] text-muted-foreground">
                  Share your personal hyperhidrosis story or educational content to help others
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website-url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website URL
                </Label>
                <Input
                  id="website-url"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={localSettings.website_url}
                  onChange={(e) =>
                    setLocalSettings(prev => ({ ...prev, website_url: e.target.value }))
                  }
                />
                <div className="text-[0.8rem] text-muted-foreground">
                  Link to your website with hyperhidrosis resources, treatments, or support information
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Control how your data is used to help the hyperhidrosis community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Data Sharing</Label>
                  <div className="text-[0.8rem] text-muted-foreground">
                    Allow anonymous data to help research (no personal info shared)
                  </div>
                </div>
                <Switch
                  checked={localSettings.data_sharing}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({ ...prev, data_sharing: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Permission Alert */}
          {'Notification' in window && Notification.permission === 'default' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Enable browser notifications to receive reminders and alerts. Click "Save Changes" to request permission.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
