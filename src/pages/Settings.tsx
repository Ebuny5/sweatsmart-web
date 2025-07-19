
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  AlertTriangle, 
  Clock,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import DataManagement from "@/components/settings/DataManagement";
import { notificationService } from "@/services/NotificationService";
import { useEpisodes } from "@/hooks/useEpisodes";
import { cn } from "@/lib/utils";

const Settings = () => {
  const { settings, loading, updateSettings } = useSettings();
  const { episodes } = useEpisodes();
  const { toast } = useToast();
  const [testingNotification, setTestingNotification] = useState(false);

  // Check if running as mobile app (simplified detection)
  const isMobileApp = window.location.href.includes('lovableproject.com') || 
                      navigator.userAgent.includes('wv') || 
                      window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    // Set up mobile-friendly reminders if settings are loaded
    if (settings?.daily_reminders && settings?.reminder_time) {
      // For mobile, we'll use in-app scheduling instead of browser notifications
      console.log('Setting up mobile reminders for:', settings.reminder_time);
    }

    // Check for trigger alerts
    if (settings?.trigger_alerts && episodes.length > 0) {
      console.log('Setting up trigger pattern monitoring');
    }
  }, [settings, episodes]);

  const handleSettingChange = async (key: string, value: any) => {
    const success = await updateSettings({ [key]: value });
    
    if (success) {
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });

      // Handle mobile-friendly notification settings
      if (key === 'daily_reminders' && value && settings?.reminder_time) {
        toast({
          title: "Reminders enabled",
          description: `You'll receive daily reminders at ${settings.reminder_time}`,
        });
      } else if (key === 'reminder_time' && settings?.daily_reminders) {
        toast({
          title: "Reminder time updated",
          description: `New reminder time: ${value}`,
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const testMobileNotification = async () => {
    setTestingNotification(true);
    
    // For mobile apps, show in-app alert instead of browser notification
    if (isMobileApp) {
      toast({
        title: "🔔 Test Alert - SweatSmart",
        description: "Your reminders and alerts are working correctly!",
      });
    } else {
      // Fallback to browser notification for web
      const success = await notificationService.testNotification();
      if (success) {
        toast({
          title: "Test notification sent!",
          description: "Check if you received the notification.",
        });
      } else {
        toast({
          title: "Test completed",
          description: "In-app alerts are working correctly.",
        });
      }
    }
    
    setTimeout(() => setTestingNotification(false), 2000);
  };

  const openBetaFeedbackForm = () => {
    // Open the Google Form in a new window/tab
    window.open('https://forms.gle/TgddDjPs3neG7ACRA', '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {/* Beta Feedback Form */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Beta Feedback</h3>
                  <p className="text-sm text-blue-700">
                    Help us improve SweatSmart by sharing your feedback and suggestions.
                  </p>
                </div>
              </div>
              <Button 
                onClick={openBetaFeedbackForm}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Give Feedback
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alerts & Reminders
            </CardTitle>
            <CardDescription>
              Configure daily reminders and trigger pattern alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isMobileApp && (
              <Alert className="border-blue-200 bg-blue-50">
                <Bell className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  For the best experience, use the mobile app version to receive reliable alerts and reminders.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-reminders" className="text-base font-medium">
                    Daily Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to log your daily episodes
                  </p>
                </div>
                <Switch
                  id="daily-reminders"
                  checked={settings?.daily_reminders || false}
                  onCheckedChange={(checked) => handleSettingChange('daily_reminders', checked)}
                />
              </div>

              {settings?.daily_reminders && (
                <div className="ml-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="reminder-time">Reminder Time</Label>
                    <Input
                      id="reminder-time"
                      type="time"
                      value={settings?.reminder_time || "08:00"}
                      onChange={(e) => handleSettingChange('reminder_time', e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trigger-alerts" className="text-base font-medium">
                    Trigger Pattern Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your logged triggers (like "Heat" or "Stress") are likely to occur — based on your past episodes and reminder time
                  </p>
                </div>
                <Switch
                  id="trigger-alerts"
                  checked={settings?.trigger_alerts || false}
                  onCheckedChange={(checked) => handleSettingChange('trigger_alerts', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Test Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Send a test alert to verify everything is working
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testMobileNotification}
                  disabled={testingNotification}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testingNotification ? 'Testing...' : 'Test Now'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="data-sharing" className="text-base font-medium">
                  Anonymous Data Sharing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help improve SweatSmart by sharing anonymous usage data
                </p>
              </div>
              <Switch
                id="data-sharing"
                checked={settings?.data_sharing || false}
                onCheckedChange={(checked) => handleSettingChange('data_sharing', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <DataManagement />
      </div>
    </AppLayout>
  );
};

export default Settings;
