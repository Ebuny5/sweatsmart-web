
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
  Clock,
  TestTube,
  MessageSquare,
  ExternalLink,
  Smartphone,
  Bug
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import DataManagement from "@/components/settings/DataManagement";
import { enhancedMobileNotificationService } from "@/services/EnhancedMobileNotificationService";
import { useEpisodes } from "@/hooks/useEpisodes";
import MobileDebugInfo from "@/components/debug/MobileDebugInfo";

const Settings = () => {
  const { settings, loading, updateSettings } = useSettings();
  const { episodes } = useEpisodes();
  const { toast } = useToast();
  const [testingNotification, setTestingNotification] = useState(false);

  // Check if running as mobile app
  const isMobileApp = enhancedMobileNotificationService.isMedianApp();

  useEffect(() => {
    console.log('🔧 Settings: Mobile app detected:', isMobileApp);
    console.log('📱 Settings: User agent:', navigator.userAgent);
    console.log('🌐 Settings: Current URL:', window.location.href);

    // Set up mobile-friendly reminders if settings are loaded
    if (settings?.daily_reminders && settings?.reminder_time) {
      console.log('📅 Settings: Setting up reminders for:', settings.reminder_time);
      enhancedMobileNotificationService.scheduleReminder(settings.reminder_time);
    }

    // Cache episodes for trigger analysis
    if (episodes.length > 0) {
      console.log('🔍 Settings: Caching episodes for trigger monitoring:', episodes.length);
      enhancedMobileNotificationService.cacheEpisodesForAnalysis(episodes);
      
      // Run immediate trigger analysis if enabled
      if (settings?.trigger_alerts) {
        enhancedMobileNotificationService.analyzeAndAlertTriggers(episodes);
      }
    }
  }, [settings, episodes, isMobileApp]);

  const handleSettingChange = async (key: string, value: any) => {
    const success = await updateSettings({ [key]: value });
    
    if (success) {
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });

      // Handle mobile-friendly notification settings
      if (key === 'daily_reminders') {
        if (value && settings?.reminder_time) {
          enhancedMobileNotificationService.scheduleReminder(settings.reminder_time);
          toast({
            title: "Reminders enabled",
            description: `You'll receive daily reminders at ${settings.reminder_time}`,
          });
        } else {
          enhancedMobileNotificationService.clearReminders();
        }
      } else if (key === 'reminder_time' && settings?.daily_reminders) {
        enhancedMobileNotificationService.scheduleReminder(value);
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

  const testCompleteNotificationSystem = async () => {
    setTestingNotification(true);
    console.log('🧪 Testing complete notification system...');
    
    enhancedMobileNotificationService.testNotificationSystem();
    
    setTimeout(() => setTestingNotification(false), 3000);
  };

  const openBetaFeedbackForm = () => {
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

        {/* Mobile App Status */}
        {isMobileApp && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Mobile APK Detected</h3>
                  <p className="text-sm text-green-700">
                    Enhanced mobile notifications, alerts, and trigger analysis are active.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Information for Mobile */}
        {isMobileApp && <MobileDebugInfo />}

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

        {/* Enhanced Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Professional Alerts & Reminders
              {isMobileApp && <Badge variant="secondary" className="bg-green-100 text-green-800">APK Enhanced</Badge>}
            </CardTitle>
            <CardDescription>
              Professional-grade notification system with mobile optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-reminders" className="text-base font-medium">
                    Daily Episode Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get persistent reminders to log your daily episodes with smart scheduling
                  </p>
                </div>
                <Switch
                  id="daily-reminders"
                  checked={settings?.daily_reminders || false}
                  onCheckedChange={(checked) => handleSettingChange('daily_reminders', checked)}
                />
              </div>

              {settings?.daily_reminders && (
                <div className="ml-4 space-y-3 p-4 bg-muted/50 rounded-lg">
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
                  <Alert>
                    <AlertDescription>
                      {isMobileApp 
                        ? "Mobile APK: Reminders will show as in-app notifications and toasts."
                        : "Web: Reminders will appear as browser notifications (permission required)."
                      }
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trigger-alerts" className="text-base font-medium">
                    Intelligent Trigger Pattern Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    AI-powered analysis of your episodes to detect trigger patterns and severity trends
                  </p>
                </div>
                <Switch
                  id="trigger-alerts"
                  checked={settings?.trigger_alerts || false}
                  onCheckedChange={(checked) => handleSettingChange('trigger_alerts', checked)}
                />
              </div>

              {settings?.trigger_alerts && (
                <div className="ml-4 p-4 bg-muted/50 rounded-lg">
                  <Alert>
                    <AlertDescription>
                      The system analyzes your episodes hourly and alerts you when:
                      <ul className="list-disc ml-4 mt-2">
                        <li>Frequent triggers are detected (60%+ of recent episodes)</li>
                        <li>Episode severity shows an increasing trend</li>
                        <li>Unusual patterns are identified</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Test Complete Notification System</Label>
                  <p className="text-sm text-muted-foreground">
                    {isMobileApp 
                      ? "Test all mobile notification features including APK-specific handling"
                      : "Test browser notifications, reminders, and trigger alerts"
                    }
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testCompleteNotificationSystem}
                  disabled={testingNotification}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testingNotification ? 'Testing...' : 'Test All Systems'}
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
