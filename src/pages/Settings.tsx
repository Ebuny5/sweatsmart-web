
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield } from "lucide-react";
import { supabase, withRetry } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DataManagement from "@/components/settings/DataManagement";
import { UserSettings } from "@/types";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    user_id: '',
    daily_reminders: true,
    reminder_time: "20:00",
    trigger_alerts: false,
    data_sharing: false,
    created_at: '',
    updated_at: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching settings for user:', user.id);
        
        const { data, error } = await withRetry(() =>
          supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
        );

        if (error) {
          console.error('Error fetching settings:', error);
          // Create default settings if they don't exist
          if (error.code === 'PGRST116') {
            console.log('Settings not found, creating default settings...');
            const { data: newSettings, error: createError } = await withRetry(() =>
              supabase
                .from('user_settings')
                .insert({
                  user_id: user.id,
                  daily_reminders: true,
                  reminder_time: "20:00",
                  trigger_alerts: false,
                  data_sharing: false,
                })
                .select()
                .single()
            );

            if (createError) {
              console.error('Error creating settings:', createError);
              toast({
                title: "Error",
                description: "Failed to create settings. Please refresh the page.",
                variant: "destructive",
              });
            } else {
              setSettings(newSettings);
            }
          }
        } else if (data) {
          console.log('Settings loaded:', data);
          setSettings(data);
        }
      } catch (error) {
        console.error('Settings fetch error:', error);
        toast({
          title: "Error", 
          description: "Failed to load settings. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, toast]);

  const updateSetting = async (key: keyof UserSettings, value: boolean | string) => {
    if (!user) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      console.log('Updating setting:', key, value);
      
      const { error } = await withRetry(() =>
        supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            ...newSettings,
          })
          .select()
          .single()
      );

      if (error) {
        console.error('Error updating setting:', error);
        throw error;
      }

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
    } catch (error) {
      console.error('Error updating setting:', error);
      // Revert the setting on error
      setSettings(settings);
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await withRetry(() =>
        supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            ...settings,
          })
          .select()
          .single()
      );

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
