import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudRainWind, Thermometer, Droplets, Sun, AlertTriangle, History, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ClimateMonitor = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CloudRainWind className="h-8 w-8 text-primary" />
              Climate Alert System
            </h1>
            <p className="text-muted-foreground mt-2">
              Real-time weather monitoring and personalized alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/climate/history')}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/climate/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudRainWind className="h-5 w-5 text-primary" />
              Weather Monitoring Active
            </CardTitle>
            <CardDescription>
              Track weather conditions that may trigger hyperhidrosis episodes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Thermometer className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">--°C</p>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Droplets className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">--%</p>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Sun className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">--</p>
                  <p className="text-xs text-muted-foreground">UV Index</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-green-700 dark:text-green-400">
                  All Clear
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                No alerts at this time
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-orange-500" />
                Temperature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor temperature levels and receive alerts when thresholds are exceeded
              </p>
              <div className="mt-4">
                <Badge variant="outline">Threshold: 25°C</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                Humidity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track humidity levels that may trigger sweating episodes
              </p>
              <div className="mt-4">
                <Badge variant="outline">Threshold: 60%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                UV Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor UV exposure to prevent heat-related triggers
              </p>
              <div className="mt-4">
                <Badge variant="outline">Threshold: UV 6</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">How Climate Alerts Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 shrink-0">1</Badge>
              <p className="text-sm">
                We continuously monitor weather conditions in your area including temperature, humidity, and UV index
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 shrink-0">2</Badge>
              <p className="text-sm">
                Compare current conditions against your personalized thresholds set in Settings
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 shrink-0">3</Badge>
              <p className="text-sm">
                Send you timely notifications when conditions may trigger a hyperhidrosis episode
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 shrink-0">4</Badge>
              <p className="text-sm">
                Learn from your episode history to improve alert accuracy and personalization over time
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Setup & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              To receive real-time climate alerts, make sure you have:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0">✓</Badge>
                <span>Location permissions enabled for accurate weather data</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0">✓</Badge>
                <span>Push notifications enabled to receive alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0">✓</Badge>
                <span>Personal thresholds configured in Climate Settings</span>
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/climate/settings')}
            >
              Configure Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ClimateMonitor;
