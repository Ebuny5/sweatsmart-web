import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Save, Info, CloudSun, Database, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { notificationManager } from '@/services/NotificationManager';
import { audioAlertPlayer } from '@/utils/audioAlertPlayer';
import { SettingsPanel } from '@/components/climate/SettingsPanel';

const Settings = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [dataRetention, setDataRetention] = useState(30);

  useEffect(() => {
    const saved = localStorage.getItem('climateAppSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAutoRefresh(parsed.autoRefresh ?? true);
      setSoundAlerts(parsed.soundAlerts ?? true);
      setDataRetention(parsed.dataRetention ?? 30);
    }
  }, []);

  useEffect(() => {
    audioAlertPlayer.setSoundEnabled(soundAlerts);
  }, [soundAlerts]);

  const handleSaveSettings = () => {
    const settings = {
      autoRefresh,
      soundAlerts,
      dataRetention
    };
    localStorage.setItem('climateAppSettings', JSON.stringify(settings));
    audioAlertPlayer.setSoundEnabled(soundAlerts);
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-zinc-400">Manage your app preferences</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Compulsory 4-hour App Alerts */}
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">App Alerts (Native)</h2>
              <p className="text-sm text-zinc-400">A check‑in alert is sent every 4 hours after your last log to help you track episodes.</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-500/10 text-green-500 px-3 py-1 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Active (Capacitor)
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">These alerts work in the background. If prompted, please allow notifications so they can appear even when the app is closed.</p>
        </Card>

        {/* Climate Alert Settings */}
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CloudSun className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Climate Alerts</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">Auto-Refresh Weather</div>
                <div className="text-sm text-zinc-400">
                  Automatically update weather data every 15 minutes
                </div>
              </div>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">Sound Alerts</div>
                <div className="text-sm text-zinc-400">
                  Play a "water + voice" sequence when risk conditions are detected
                </div>
              </div>
              <Switch
                checked={soundAlerts}
                onCheckedChange={setSoundAlerts}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="border-t border-zinc-800 pt-6 mt-6">
              <SettingsPanel />
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Data Management</h2>
          </div>
          
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
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-2">
                <span>7 days</span>
                <span>90 days</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy Notice */}
        <Card className="p-6 bg-blue-950/20 border-blue-900">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-400">
            <Info className="w-5 h-5" />
            Privacy Notice
          </h3>
          <p className="text-sm text-zinc-400">
            All your data is stored locally on your device. We do not collect or transmit any personal information. 
            Your location is only used to fetch weather data and is never shared with third parties.
          </p>
        </Card>

        {/* Test Notifications */}
        <Card className="p-6 border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <TestTube className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-amber-500">Developer Tools</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Trigger a test notification to verify audio and alert delivery.
          </p>
          <Button
            variant="outline"
            className="w-full border-amber-900/50 hover:bg-amber-900/20 text-amber-500"
            onClick={async () => {
              toast.info("Triggering voice & water test...");
              await notificationManager.send({
                channel: 'system',
                kind: 'reminder',
                title: "🔊 Voice & Water Test",
                body: "Testing the unified audio alert system! 💧",
                dedupKey: `test-${Date.now()}`
              });
            }}
          >
            Voice & Water Alert Test
          </Button>
        </Card>

        {/* App Information */}
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <h3 className="text-lg font-bold mb-4">About SweatSmart</h3>
          <div className="space-y-3 text-sm text-zinc-400">
            <p>
              <strong className="text-zinc-100">Version:</strong> 1.0.0
            </p>
            <p>
              <strong className="text-zinc-100">Purpose:</strong> Monitor real-time climate conditions
              and provide personalized alerts for hyperhidrosis management.
            </p>
            <p>
              <strong className="text-zinc-100">Data Sources:</strong> OpenWeatherMap API,
              simulated EDA sensor readings
            </p>
          </div>
        </Card>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSaveSettings}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            size="lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
