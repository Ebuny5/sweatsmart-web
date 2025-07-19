
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
  RefreshCw
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
  const [checkingPermission, setCheckingPermission] = useState(false);

  const checkNotificationPermission = () => {
    const permission = notificationService.getPermissionStatus();
    console.log('Checking notification permission:', permission);
    setNotificationPermission(permission);
    return permission;
  };

  useEffect(() => {
    // Initial permission check
    checkNotificationPermission();
    
    // Set up reminder if settings are already loaded and permission is granted
    const currentPermission = checkNotificationPermission();
    if (settings?.daily_reminders && settings?.reminder_time && currentPermission === 'granted') {
      notificationService.scheduleReminder(settings.reminder_time);
    }

    // Check for trigger alerts
    if (settings?.trigger_alerts && episodes.length > 0 && currentPermission === 'granted') {
      notificationService.checkTriggerAlerts(episodes);
    }
  }, [settings, episodes]);

  const handleSettingChange = async (key: string, value: any) => {
    // If enabling notifications, request permission first
    if ((key === 'daily_reminders' || key === 'trigger_alerts') && value) {
      const hasPermission = await notificationService.requestPermission();
      const newPermission = checkNotificationPermission();
      
      if (!hasPermission) {
        toast({
          title: "Permission Required",
          description: "Please allow notifications in your browser to enable this feature. Check the address bar for notification prompts.",
          variant: "destructive",
        });
        return;
      }
    }

    const success = await updateSettings({ [key]: value });
    
    if (success) {
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });

      // Handle notification-specific settings
      if (key === 'daily_reminders' && value && settings?.reminder_time) {
        notificationService.scheduleReminder(settings.reminder_time);
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
    
    // Request permission first if not granted
    const hasPermission = await notificationService.requestPermission();
    checkNotificationPermission();
    
    if (!hasPermission) {
      toast({
        title: "Permission Required",
        description: "Please allow notifications in your browser. Look for the notification prompt in your address bar.",
        variant: "destructive"
      });
      setTestingNotification(false);
      return;
    }

    const success = await notificationService.testNotification();
    
    if (success) {
      toast({
        title: "Test notification sent!",
        description: "Check if you received the notification.",
      });
    } else {
      toast({
        title: "Test failed",
        description: "Unable to send test notification. Please check your browser permissions.",
        variant: "destructive"
      });
    }
    
    setTimeout(() => setTestingNotification(false), 2000);
  };

  const refreshPermissionStatus = async () => {
    setCheckingPermission(true);
    
    // Small delay to ensure UI feedback
    setTimeout(() => {
      const newPermission = checkNotificationPermission();
      console.log('Refreshed permission status:', newPermission);
      
      if (newPermission === 'granted') {
        toast({
          title: "Notifications Enabled!",
          description: "Your notifications are now working properly.",
        });
      }
      
      setCheckingPermission(false);
    }, 500);
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

  const requestNotificationPermission = async () => {
    const hasPermission = await notificationService.requestPermission();
    
    // Give browser time to update permission
    setTimeout(() => {
      checkNotificationPermission();
    }, 1000);
    
    if (hasPermission) {
      toast({
        title: "Notifications Enabled!",
        description: "You can now receive reminders and alerts.",
      });
    } else {
      toast({
        title: "Permission Required",
        description: "Please manually enable notifications in your browser settings or look for the notification prompt in your address bar.",
        variant: "destructive"
      });
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
              <div className="flex items-center gap-2">
                {getPermissionBadge()}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshPermissionStatus}
                  disabled={checkingPermission}
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", checkingPermission && "animate-spin")} />
                  Refresh
                </Button>
                {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
                  <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
                    Enable Notifications
                  </Button>
                )}
              </div>
            </div>

            {notificationPermission === 'denied' && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Notifications are blocked in your browser. To enable:
                  <br />
                  <strong>Chrome:</strong> Click the lock/notification icon in your address bar → Notifications → Allow
                  <br />
                  <strong>Or:</strong> Go to Settings → Site Settings → Notifications → Allow for this site
                </AlertDescription>
              </Alert>
            )}

            {notificationPermission === 'default' && (
              <Alert className="border-blue-200 bg-blue-50">
                <Bell className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Click "Enable Notifications" above to receive reminders and trigger alerts. 
                  Look for the notification prompt in your browser's address bar.
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
                  disabled={testingNotification}
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
