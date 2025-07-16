
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bell, Clock, Youtube, Globe, AlertTriangle } from "lucide-react";

interface UserSettings {
  id?: string;
  user_id: string;
  daily_reminders: boolean;
  reminder_time: string;
  trigger_alerts: boolean;
  data_sharing: boolean;
  youtube_url?: string;
  website_url?: string;
  created_at?: string;
  updated_at?: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    user_id: user?.id || '',
    daily_reminders: true,
    reminder_time: '08:00',
    trigger_alerts: true,
    data_sharing: false,
    youtube_url: '',
    website_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        // Create default settings if none exist
        await createDefaultSettings();
      } else if (data) {
        setSettings({
          ...data,
          youtube_url: data.youtube_url || '',
          website_url: data.website_url || ''
        });
      } else {
        // No settings found, create default
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const defaultSettings = {
        user_id: user.id,
        daily_reminders: true,
        reminder_time: '08:00',
        trigger_alerts: true,
        data_sharing: false,
        youtube_url: '',
        website_url: ''
      };

      const { data, error } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        daily_reminders: settings.daily_reminders,
        reminder_time: settings.reminder_time,
        trigger_alerts: settings.trigger_alerts,
        data_sharing: settings.data_sharing,
        youtube_url: settings.youtube_url || null,
        website_url: settings.website_url || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });

      // Schedule notifications if enabled
      if (settings.daily_reminders || settings.trigger_alerts) {
        scheduleNotifications();
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
    if (settings.daily_reminders) {
      const [hours, minutes] = settings.reminder_time.split(':');
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
                  checked={settings.daily_reminders}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, daily_reminders: checked }))
                  }
                />
              </div>

              {settings.daily_reminders && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Reminder Time
                  </Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={settings.reminder_time}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, reminder_time: e.target.value }))
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
                  checked={settings.trigger_alerts}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, trigger_alerts: checked }))
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
                Add links to help others learn about hyperhidrosis
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
                  value={settings.youtube_url}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, youtube_url: e.target.value }))
                  }
                />
                <div className="text-[0.8rem] text-muted-foreground">
                  Share your personal story or educational content
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
                  value={settings.website_url}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, website_url: e.target.value }))
                  }
                />
                <div className="text-[0.8rem] text-muted-foreground">
                  Link to your website with hyperhidrosis resources
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Control how your data is used
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
                  checked={settings.data_sharing}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, data_sharing: checked }))
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
