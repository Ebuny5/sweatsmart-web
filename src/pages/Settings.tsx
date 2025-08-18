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
import DataManagement from "@/components/settings/DataManagement";
import { Bell, Clock, Volume2, VolumeX, TestTube, Smartphone } from "lucide-react";

const Settings = () => {
  const [reminderTime, setReminderTime] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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
      title: enabled ? "Sound enabled" : "Sound disabled",
      description: `Notification sounds are now ${enabled ? 'on' : 'off'}`,
    });
  };

  const testNotificationSound = async () => {
    // Show immediate feedback
    toast({
      title: "Testing notifications...",
      description: "You should hear a sound if audio is working properly",
    });
    
    // Test the complete system
    await enhancedMobileNotificationService.testNotificationSystem();
  };

  const isMedianApp = enhancedMobileNotificationService.isMedianApp();

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
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
              Notifications & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Notification Sounds
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play sound when notifications appear
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to log your daily episodes
                  </p>
                </div>
                <Switch
                  checked={remindersEnabled}
                  onCheckedChange={handleReminderToggle}
                />
              </div>

              {remindersEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Reminder Time</Label>
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
                Test Notifications & Sound
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Click to test if notifications and sound are working properly.
                <br />
                <strong>Note:</strong> You must interact with the page first (click, tap, or scroll) to enable sound.
              </p>
            </div>
          </CardContent>
        </Card>

        <DataManagement />
      </div>
    </AppLayout>
  );
};

export default Settings;
