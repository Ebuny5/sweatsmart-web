import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { climateNotificationService } from '@/services/ClimateNotificationService';

interface HistoryItem {
  title: string;
  body: string;
  weather: { temperature: number; humidity: number; uvIndex: number; description?: string };
  alerts: string[];
  timestamp: string;
}

export default function ClimateHistory() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(climateNotificationService.getNotificationHistory() as HistoryItem[]);
  }, []);

  const clear = () => {
    climateNotificationService.clearHistory();
    setItems([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Heat Warnings History</h1>
            <p className="text-sm text-muted-foreground">Recent climate alerts sent to you</p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={clear}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full border border-dashed" />
            <div className="font-semibold mb-1">No Heat Warnings Yet</div>
            <p className="text-sm">When heat warnings are triggered, they will appear here. Enable background monitoring in settings for automatic alerts.</p>
          </Card>
        ) : (
          items
            .slice()
            .reverse()
            .map((n, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-sm text-muted-foreground">{n.body}</div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">{n.weather.temperature}°C</div>
                    <div className="text-xs text-muted-foreground">Temperature</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{n.weather.humidity}%</div>
                    <div className="text-xs text-muted-foreground">Humidity</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{n.weather.uvIndex}</div>
                    <div className="text-xs text-muted-foreground">UV Index</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">Triggered by: {n.alerts.join(', ')}</div>
              </Card>
            ))
        )}
      </main>
    </div>
  );
}
