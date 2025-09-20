
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { enhancedMobileNotificationService } from "@/services/EnhancedMobileNotificationService";
import { soundManager } from "@/utils/soundManager";
import DataManagement from "@/components/settings/DataManagement";
import { Bell, Clock, Volume2, VolumeX, TestTube, Smartphone, AlertTriangle, Info } from "lucide-react";

const Settings = () => {
  const [reminderTime, setReminderTime] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [debugEnabled, setDebugEnabled] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing reminder settings
    const savedSchedule = localStorage.getItem('sweatsmart_reminder_schedule');
    if (savedSchedule) {
      const schedule = JSON.parse(savedSchedule);
      if (schedule.enabled && schedule.time) {
        setReminderTime(schedule.time);
        setRemindersEnabled(true);
      }
    }

    // Load sound preference
    const soundPref = localStorage.getItem('sweatsmart_sound_enabled');
    if (soundPref !== null) {
      setSoundEnabled(JSON.parse(soundPref));
    }

    // Load debug preference
    const debugPref = localStorage.getItem('sweatsmart_debug_mode');
    if (debugPref !== null) {
      setDebugEnabled(debugPref === 'true');
    }
  }, []);

  const handleReminderToggle = (enabled: boolean) => {
    setRemindersEnabled(enabled);
    
    if (enabled && reminderTime) {
      enhancedMobileNotificationService.scheduleReminder(reminderTime);
    } else {
      enhancedMobileNotificationService.clearReminders();
    }
  };

  const handleTimeChange = (time: string) => {
    setReminderTime(time);
    
    if (remindersEnabled && time) {
      enhancedMobileNotificationService.scheduleReminder(time);
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    enhancedMobileNotificationService.setSoundEnabled(enabled);
    
    toast({
      title: enabled ? "Professional sound enabled" : "Sound disabled",
      description: `Professional medical notification sounds are now ${enabled ? 'on' : 'off'}`,
    });

  };

  const handleDebugToggle = (enabled: boolean) => {
    setDebugEnabled(enabled);
    localStorage.setItem('sweatsmart_debug_mode', String(enabled));
    toast({
      title: enabled ? "Debug Mode enabled" : "Debug Mode disabled",
      description: enabled ? 'Verbose logs will be printed during AI analysis' : 'Verbose logs disabled',
    });
  };

  const testNotificationSound = async () => {
    toast({
      title: "Testing professional notification system...",
      description: "You will receive persistent notifications with professional tunnel-like medical alarm sounds",
    });
    
    await enhancedMobileNotificationService.testNotificationSystem();
  };

  const testSpecificSound = async (severity: 'CRITICAL' | 'WARNING' | 'REMINDER', label: string) => {
    toast({
      title: `Testing Professional ${label}...`,
      description: `Playing ${label.toLowerCase()} with sustained tunnel-like sound`,
    });
    
    await soundManager.testSound(severity);
  };

  const isMedianApp = enhancedMobileNotificationService.isMedianApp();

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Professional Settings</h1>
          {isMedianApp && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Mobile App
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Professional Medical Alert System
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Persistent notifications that work even when the app is closed, with professional tunnel-like medical alarm sounds.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Professional Medical Alarm Sounds
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play professional-grade tunnel-like alarm sounds for medical notifications
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Test Professional Alarm Types</h4>
              <p className="text-xs text-muted-foreground">
                Each sound features a professional tunnel-like quality with sustained tones for medical environments.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  onClick={() => testSpecificSound('REMINDER', 'Gentle Professional Reminder')}
                  variant="outline"
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Info className="h-4 w-4" />
                  Test Reminder
                </Button>
                
                <Button 
                  onClick={() => testSpecificSound('WARNING', 'Professional Warning Alert')}
                  variant="outline"
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Test Warning
                </Button>
                
                <Button 
                  onClick={() => testSpecificSound('CRITICAL', 'Critical Medical Alarm')}
                  variant="destructive"
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Test Critical
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Professional Daily Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Persistent reminders to log episodes (works even when app is closed)
                  </p>
                </div>
                <Switch
                  checked={remindersEnabled}
                  onCheckedChange={handleReminderToggle}
                />
              </div>

              {remindersEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Professional Reminder Time</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Button 
                onClick={testNotificationSound}
                variant="outline"
                className="w-full"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test Complete Professional Alert System
              </Button>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Professional Notification Features:
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• <strong>Persistent notifications</strong> - Work even when app is closed</li>
                  <li>• <strong>Tunnel-like sounds</strong> - Professional medical-grade sustained tones</li>
                  <li>• <strong>System integration</strong> - Appears over other apps</li>
                  <li>• <strong>User interaction required</strong> - Click, tap, or scroll to enable sound</li>
                  <li>• <strong>Volume optimized</strong> - Professional medical alert volume levels</li>
                  <li>• <strong>Mobile vibration</strong> - Enhanced vibration patterns for different alert types</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Mode</CardTitle>
            <p className="text-sm text-muted-foreground">Enable verbose logging for AI analysis and connectivity checks.</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label>Enable Debug Mode</Label>
              <Switch checked={debugEnabled} onCheckedChange={handleDebugToggle} />
            </div>
          </CardContent>
        </Card>

        <DataManagement />
      </div>
    </AppLayout>
  );
};

export default Settings;
