
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
  AlertCircle
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import DataManagement from "@/components/settings/DataManagement";
import { notificationService } from "@/services/NotificationService";
import { useEpisodes } from "@/hooks/useEpisodes";

const Settings = () => {
  const { settings, loading, updateSettings } = useSettings();
  const { episodes } = useEpisodes();
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [testingNotification, setTestingNotification] = useState(false);

  useEffect(() => {
    // Check notification permission status
    const checkPermission = () => {
      const permission = notificationService.getPermissionStatus();
      setNotificationPermission(permission);
    };

    checkPermission();
    
    // Set up reminder if settings are already loaded
    if (settings?.daily_reminders && settings?.reminder_time) {
      notificationService.scheduleReminder(settings.reminder_time);
    }

    // Check for trigger alerts
    if (settings?.trigger_alerts && episodes.length > 0) {
      notificationService.checkTriggerAlerts(episodes);
    }
  }, [settings, episodes]);

  const handleSettingChange = async (key: string, value: any) => {
    const success = await updateSettings({ [key]: value });
    
    if (success) {
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });

      // Handle notification-specific settings
      if (key === 'daily_reminders' && value) {
        const hasPermission = await notificationService.requestPermission();
        if (hasPermission && settings?.reminder_time) {
          notificationService.scheduleReminder(settings.reminder_time);
        }
        setNotificationPermission(notificationService.getPermissionStatus());
      } else if (key === 'daily_reminders' && !value) {
        notificationService.clearReminders();
      } else if (key === 'reminder_time' && settings?.daily_reminders) {
        notificationService.scheduleReminder(value);
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const testNotification = async () => {
    setTestingNotification(true);
    const success = await notificationService.testNotification();
    
    if (success) {
      toast({
        title: "Test notification sent!",
        description: "Check if you received the notification.",
      });
    } else {
      toast({
        title: "Test failed",
        description: "Unable to send test notification. Check your browser permissions.",
        variant: "destructive"
      });
    }
    
    setTimeout(() => setTestingNotification(false), 2000);
  };

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case 'granted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Blocked</Badge>;
      case 'unsupported':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Unsupported</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Not Set</Badge>;
    }
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

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Reminders
            </CardTitle>
            <CardDescription>
              Configure alerts and daily reminders to help you track your episodes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Permission Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Browser Notifications</span>
              </div>
              {getPermissionBadge()}
            </div>

            {notificationPermission === 'denied' && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Notifications are blocked. Please enable them in your browser settings to receive reminders and alerts.
                  <br />
                  <span className="text-xs mt-1 block">Chrome: Click the lock icon in address bar → Notifications → Allow</span>
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
                    Get notified when patterns in your triggers are detected
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
                  <Label className="text-base font-medium">Test Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send a test notification to verify everything is working
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testNotification}
                  disabled={testingNotification || notificationPermission !== 'granted'}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testingNotification ? 'Sending...' : 'Test Now'}
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
