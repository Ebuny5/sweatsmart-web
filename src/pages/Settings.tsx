
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Bell, Clock, BarChart3, Shield, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DataManagement from "@/components/settings/DataManagement";

interface UserSettings {
  reminder_enabled: boolean;
  reminder_time: string;
  weekly_report_enabled: boolean;
  trigger_alerts_enabled: boolean;
  data_sharing: boolean;
  anonymous_sharing: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    reminder_enabled: true,
    reminder_time: "20:00",
    weekly_report_enabled: true,
    trigger_alerts_enabled: false,
    data_sharing: false,
    anonymous_sharing: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error);
        } else if (data) {
          setSettings({
            reminder_enabled: data.reminder_enabled ?? true,
            reminder_time: data.reminder_time ?? "20:00",
            weekly_report_enabled: data.weekly_report_enabled ?? true,
            trigger_alerts_enabled: data.trigger_alerts_enabled ?? false,
            data_sharing: data.data_sharing ?? false,
            anonymous_sharing: data.anonymous_sharing ?? true,
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
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

  const updateSetting = (key: keyof UserSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
                  checked={settings.reminder_enabled}
                  onCheckedChange={(checked) => updateSetting('reminder_enabled', checked)}
                />
              </div>
              
              {settings.reminder_enabled && (
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
                  <Label htmlFor="weekly-report">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly insights and trends
                  </p>
                </div>
                <Switch
                  id="weekly-report"
                  checked={settings.weekly_report_enabled}
                  onCheckedChange={(checked) => updateSetting('weekly_report_enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="trigger-alerts">Trigger Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about potential triggers
                  </p>
                </div>
                <Switch
                  id="trigger-alerts"
                  checked={settings.trigger_alerts_enabled}
                  onCheckedChange={(checked) => updateSetting('trigger_alerts_enabled', checked)}
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
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous-sharing">Anonymous Community Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Share anonymous insights with the community
                  </p>
                </div>
                <Switch
                  id="anonymous-sharing"
                  checked={settings.anonymous_sharing}
                  onCheckedChange={(checked) => updateSetting('anonymous_sharing', checked)}
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
