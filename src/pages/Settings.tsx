import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, User, Shield, Clock, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/useSettings';
import { useProfile } from '@/hooks/useProfile';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const Settings = () => {
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  
  const [displayName, setDisplayName] = useState('');
  const [dailyReminders, setDailyReminders] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [triggerAlerts, setTriggerAlerts] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setDailyReminders(settings.daily_reminders ?? true);
      setReminderTime(settings.reminder_time || '08:00');
      setTriggerAlerts(settings.trigger_alerts ?? true);
      setDataSharing(settings.data_sharing ?? false);
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    const success = await updateProfile({ display_name: displayName });
    if (success) {
      toast.success('Profile updated successfully');
    } else {
      toast.error('Failed to update profile');
    }
  };

  const handleSaveNotifications = async () => {
    const success = await updateSettings({
      daily_reminders: dailyReminders,
      reminder_time: reminderTime,
      trigger_alerts: triggerAlerts,
    });
    if (success) {
      toast.success('Notification preferences updated');
    } else {
      toast.error('Failed to update preferences');
    }
  };

  const handleSavePrivacy = async () => {
    const success = await updateSettings({
      data_sharing: dataSharing,
    });
    if (success) {
      toast.success('Privacy settings updated');
    } else {
      toast.error('Failed to update settings');
    }
  };

  if (settingsLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your app preferences</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Compulsory 4-hour App Alerts */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">App Alerts (Required)</h2>
                <p className="text-sm text-muted-foreground">A check‑in alert will be sent every 4 hours to help you log episodes.</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-500/10 text-green-600 px-3 py-1 text-xs font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500" /> Active
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">These alerts are always on. If prompted, please allow notifications so they can appear even when you're not on this page.</p>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure your notification settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Reminders</Label>
                <p className="text-sm text-muted-foreground">Receive daily episode logging reminders</p>
              </div>
              <Switch
                checked={dailyReminders}
                onCheckedChange={setDailyReminders}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reminderTime">Reminder Time</Label>
              <Input
                id="reminderTime"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Trigger Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified about potential triggers</p>
              </div>
              <Switch
                checked={triggerAlerts}
                onCheckedChange={setTriggerAlerts}
              />
            </div>

            <Button onClick={handleSaveNotifications} className="w-full">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Control your data sharing preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Sharing</Label>
                <p className="text-sm text-muted-foreground">Share anonymized data for research</p>
              </div>
              <Switch
                checked={dataSharing}
                onCheckedChange={setDataSharing}
              />
            </div>
            <Button onClick={handleSavePrivacy} className="w-full">
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
