import { Card } from '@/components/ui/card';

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
