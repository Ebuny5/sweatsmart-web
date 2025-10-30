
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

      </div>
    </AppLayout>
  );
};

export default Settings;
