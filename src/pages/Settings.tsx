
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import DataManagement from "@/components/settings/DataManagement";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, loading, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);

  const updateSetting = async (key: string, value: boolean | string) => {
    if (!user || !settings) return;
    
    try {
      console.log('Updating setting:', key, value);
      
      const success = await updateSettings({ [key]: value });

      if (success) {
        console.log('Setting updated successfully');

        // Show success message for certain settings
        if (key === 'reminder_time') {
          toast({
            title: "Reminder Time Updated",
            description: `Daily reminders will now be sent at ${value}`,
          });
        } else if (key === 'daily_reminders') {
          toast({
            title: "Daily Reminders",
            description: value ? "Daily reminders enabled" : "Daily reminders disabled",
          });
        }
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user || !settings) return;
    
    setSaving(true);
    try {
      const success = await updateSettings(settings);

      if (success) {
        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!settings) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load settings. Please refresh the page.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reminder-enabled">Daily Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to log your daily episodes
                  </p>
                </div>
                <Switch
                  id="reminder-enabled"
                  checked={settings.daily_reminders}
                  onCheckedChange={(checked) => updateSetting('daily_reminders', checked)}
                />
              </div>
              
              {settings.daily_reminders && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder-time">Reminder Time</Label>
                    <p className="text-sm text-muted-foreground">
                      When should we remind you?
                    </p>
                  </div>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={settings.reminder_time}
                    onChange={(e) => updateSetting('reminder_time', e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="trigger-alerts">Trigger Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about potential triggers
                  </p>
                </div>
                <Switch
                  id="trigger-alerts"
                  checked={settings.trigger_alerts}
                  onCheckedChange={(checked) => updateSetting('trigger_alerts', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Control how your data is used and shared
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-sharing">Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve SweatSmart by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  id="data-sharing"
                  checked={settings.data_sharing}
                  onCheckedChange={(checked) => updateSetting('data_sharing', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <DataManagement />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
