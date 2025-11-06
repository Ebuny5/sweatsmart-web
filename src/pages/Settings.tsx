import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CloudSun, Bell } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your app preferences</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Climate Aware Notifications Card */}
        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
          onClick={() => navigate('/climate-settings')}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <CloudSun className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">Climate Aware Notifications</h2>
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                  SMART
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Intelligent weather monitoring for proactive episode management
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bell className="w-4 h-4" />
                <span>Real-time alerts • 30-min monitoring • Smart cooldowns</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>

        {/* Future settings sections can go here */}
      </div>
    </div>
  );
};

export default Settings;
