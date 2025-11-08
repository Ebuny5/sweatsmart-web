import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';
const Settings = () => {
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
        {/* Compulsory 4-hour App Alerts */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">App Alerts (Required)</h2>
              <p className="text-sm text-muted-foreground">A check‑in alert will be sent every 4 hours to help you log episodes.</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-500/10 text-green-600 px-3 py-1 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Active
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">These alerts are always on. If prompted, please allow notifications so they can appear even when you’re not on this page.</p>
        </Card>

        {/* Placeholder for future settings */}
        <Card className="p-6">
          <p className="text-muted-foreground text-center py-8">
            App settings and preferences will appear here
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
