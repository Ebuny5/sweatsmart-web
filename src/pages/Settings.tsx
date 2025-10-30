import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { climateNotificationService } from "@/services/climateNotificationService";
import { Sun, CloudRain, Thermometer, Smartphone, Droplets } from "lucide-react";

const Settings = () => {
  const [climateAlertsEnabled, setClimateAlertsEnabled] = useState(true);
  const [temperatureThreshold, setTemperatureThreshold] = useState(28);
  const [humidityThreshold, setHumidityThreshold] = useState(70);
  const [uvThreshold, setUvThreshold] = useState(6);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");
  const [locationEnabled, setLocationEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load climate settings from service
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    // This would load from the actual service when user is available
    // For now, using defaults
  };

  const handleSavePreferences = async () => {
    try {
      // This would save to the service when user is available
      const preferences = {
        enabled: climateAlertsEnabled,
        temperatureThreshold,
        humidityThreshold,
        uvThreshold,
        quietHoursStart,
        quietHoursEnd,
        locationEnabled,
      };
      
      // TODO: Replace with actual user ID when auth is available
      // await climateNotificationService.updatePreferences(userId, preferences);
      
      toast({
        title: "Climate settings saved!",
        description: "Your climate alert preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClimateAlertsToggle = (enabled: boolean) => {
    setClimateAlertsEnabled(enabled);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            Mobile App
          </Badge>
        </div>

        {/* Climate Awareness Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Climate Aware Notifications
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Get alerts when weather conditions may trigger excessive sweating
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Climate Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about sweat-triggering weather conditions
                </p>
              </div>
              <Switch 
                checked={climateAlertsEnabled} 
                onCheckedChange={handleClimateAlertsToggle} 
              />
            </div>
            
            {climateAlertsEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base">
                    <Thermometer className="h-4 w-4" />
                    Temperature Alert
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="20"
                      max="40"
                      value={temperatureThreshold}
                      onChange={(e) => setTemperatureThreshold(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{temperatureThreshold}°C</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alert when temperature exceeds this level
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base">
                    <Droplets className="h-4 w-4" />
                    Humidity Alert
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="30"
                      max="95"
                      value={humidityThreshold}
                      onChange={(e) => setHumidityThreshold(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{humidityThreshold}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alert when humidity exceeds this level
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base">
                    <Sun className="h-4 w-4" />
                    UV Index Alert
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="11"
                      value={uvThreshold}
                      onChange={(e) => setUvThreshold(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{uvThreshold}+</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alert when UV index reaches this level
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quiet Hours Start</Label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quiet Hours End</Label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Location Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Use your location for accurate weather data
                    </p>
                  </div>
                  <Switch 
                    checked={locationEnabled} 
                    onCheckedChange={setLocationEnabled} 
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleSavePreferences}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Save Climate Settings
            </Button>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Climate Features</span>
              <span className="text-sm font-medium">Enabled</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
