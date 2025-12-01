import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function ClimateSettings() {
  const navigate = useNavigate();
  
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [dataRetention, setDataRetention] = useState(30); // days
  const [alertFrequency, setAlertFrequency] = useState(4); // hours

  useEffect(() => {
    const saved = localStorage.getItem('climateAppSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAutoRefresh(parsed.autoRefresh ?? true);
      setSoundAlerts(parsed.soundAlerts ?? true);
      setDataRetention(parsed.dataRetention ?? 30);
      setAlertFrequency(parsed.alertFrequency ?? 4);
    }
  }, []);

  const handleSaveSettings = () => {
    const settings = {
      autoRefresh,
      soundAlerts,
      dataRetention,
      alertFrequency
    };
    localStorage.setItem('climateAppSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/climate')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Climate Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your monitoring experience</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">General Settings</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">Auto-Refresh Weather</div>
                <div className="text-sm text-muted-foreground">
                  Automatically update weather data every 5 minutes
                </div>
              </div>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">Sound Alerts</div>
                <div className="text-sm text-muted-foreground">
                  Play a sound when risk conditions are detected
                </div>
              </div>
              <Switch
                checked={soundAlerts}
                onCheckedChange={setSoundAlerts}
              />
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-primary mb-6">Data Management</h3>
          
          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-sm font-medium mb-3">
                <span>Log Retention Period</span>
                <span className="font-bold">{dataRetention} days</span>
              </label>
              <input 
                type="range" 
                min="7" 
                max="90" 
                step="7"
                value={dataRetention} 
                onChange={(e) => setDataRetention(+e.target.value)} 
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>7 days</span>
                <span>90 days</span>
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium mb-3">
                <span>Check Interval</span>
                <span className="font-bold">Every {alertFrequency} hours</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="12" 
                step="1"
                value={alertFrequency} 
                onChange={(e) => setAlertFrequency(+e.target.value)} 
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>1 hour</span>
                <span>12 hours</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                How often to check weather conditions and trigger alerts
              </p>
            </div>
          </div>
        </Card>

        {/* Privacy Notice */}
        <Card className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Privacy Notice
          </h3>
          <p className="text-sm text-muted-foreground">
            All your data is stored locally on your device. We do not collect or transmit any personal information. 
            Your location is only used to fetch weather data and is never shared with third parties.
          </p>
        </Card>

        {/* App Information */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">About Climate Aware Notifications</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Version:</strong> 1.0.0
            </p>
            <p>
              <strong className="text-foreground">Purpose:</strong> Monitor real-time climate conditions 
              and provide personalized alerts for hyperhidrosis management.
            </p>
            <p>
              <strong className="text-foreground">Data Sources:</strong> OpenWeatherMap API, 
              simulated EDA sensor readings
            </p>
          </div>
        </Card>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSaveSettings}
            className="w-full"
            size="lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
