
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentEpisodes from "@/components/dashboard/RecentEpisodes";
import TriggerSummary from "@/components/dashboard/TriggerSummary";
import BodyAreaHeatmap from "@/components/dashboard/BodyAreaHeatmap";
import QuickActions from "@/components/dashboard/QuickActions";
import { TrendData, ProcessedEpisode, TriggerFrequency, BodyAreaFrequency, SeverityLevel, BodyArea } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<{
    weeklyData: TrendData[];
    monthlyData: TrendData[];
    triggerFrequencies: TriggerFrequency[];
    bodyAreas: BodyAreaFrequency[];
    recentEpisodes: ProcessedEpisode[];
    allEpisodes: ProcessedEpisode[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setError(null);
        console.log('Fetching dashboard data for user:', user.id);
        
        const { data: episodes, error: episodesError } = await supabase
          .from('episodes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (episodesError) {
          console.error('Error fetching episodes:', episodesError);
          throw new Error('Failed to load episodes');
        }

        console.log('Fetched episodes:', episodes?.length || 0);

        // Process episodes with better error handling
        const allEpisodes: ProcessedEpisode[] = (episodes || []).map(ep => {
          try {
            // Parse triggers safely
            let parsedTriggers = [];
            if (ep.triggers && Array.isArray(ep.triggers)) {
              parsedTriggers = ep.triggers.map((t: any) => {
                // Handle different formats of trigger data
                if (typeof t === 'string') {
                  try {
                    const parsed = JSON.parse(t);
                    return {
                      type: parsed.type || 'environmental',
                      value: parsed.value || t,
                      label: parsed.label || parsed.value || t
                    };
                  } catch {
                    return {
                      type: 'environmental',
                      value: t,
                      label: t
                    };
                  }
                } else if (t && typeof t === 'object') {
                  return {
                    type: t.type || 'environmental',
                    value: t.value || t.label || 'Unknown',
                    label: t.label || t.value || 'Unknown'
                  };
                }
                return {
                  type: 'environmental',
                  value: 'Unknown',
                  label: 'Unknown'
                };
              });
            }

            return {
              id: ep.id,
              userId: ep.user_id,
              datetime: new Date(ep.date),
              severityLevel: ep.severity as SeverityLevel,
              bodyAreas: (ep.body_areas || []) as BodyArea[],
              triggers: parsedTriggers,
              notes: ep.notes || undefined,
              createdAt: new Date(ep.created_at),
            };
          } catch (error) {
            console.error('Error processing episode:', ep.id, error);
            return {
              id: ep.id,
              userId: ep.user_id,
              datetime: new Date(ep.date),
              severityLevel: ep.severity as SeverityLevel,
              bodyAreas: (ep.body_areas || []) as BodyArea[],
              triggers: [],
              notes: ep.notes || undefined,
              createdAt: new Date(ep.created_at),
            };
          }
        });
        
        // Get recent episodes
        const recentEpisodes = allEpisodes.slice(0, 5);
        
        // Generate trigger frequencies
        const triggerCounts = new Map<string, { count: number; severities: number[] }>();
        
        allEpisodes.forEach(episode => {
          episode.triggers.forEach(trigger => {
            const key = trigger.label || trigger.value || 'Unknown';
            const existing = triggerCounts.get(key) || { count: 0, severities: [] };
            existing.count += 1;
            existing.severities.push(episode.severityLevel);
            triggerCounts.set(key, existing);
          });
        });

        const triggerFrequencies: TriggerFrequency[] = Array.from(triggerCounts.entries()).map(([label, data]) => {
          const averageSeverity = data.severities.length > 0 
            ? data.severities.reduce((a, b) => a + b, 0) / data.severities.length
            : 0;
          
          return {
            trigger: { 
              label, 
              type: 'environmental' as const, 
              value: label 
            },
            count: data.count,
            averageSeverity,
            percentage: allEpisodes.length > 0 ? Math.round((data.count / allEpisodes.length) * 100) : 0
          };
        }).sort((a, b) => b.count - a.count);
        
        // Generate body area frequencies
        const bodyAreaCounts = new Map<string, { count: number; severities: number[] }>();
        
        allEpisodes.forEach(episode => {
          episode.bodyAreas.forEach(area => {
            const existing = bodyAreaCounts.get(area) || { count: 0, severities: [] };
            existing.count += 1;
            existing.severities.push(episode.severityLevel);
            bodyAreaCounts.set(area, existing);
          });
        });

        const bodyAreas: BodyAreaFrequency[] = Array.from(bodyAreaCounts.entries()).map(([area, data]) => {
          const averageSeverity = data.severities.length > 0
            ? data.severities.reduce((a, b) => a + b, 0) / data.severities.length
            : 0;
            
          return {
            area,
            count: data.count,
            averageSeverity,
            percentage: allEpisodes.length > 0 ? Math.round((data.count / allEpisodes.length) * 100) : 0
          };
        });
        
        setData({
          weeklyData: [],
          monthlyData: [],
          triggerFrequencies,
          bodyAreas,
          recentEpisodes,
          allEpisodes,
        });
        
        console.log('Dashboard data processed successfully');
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard');
        toast({
          title: "Error loading dashboard",
          description: "Please refresh the page to try again.",
          variant: "destructive",
        });
        
        // Set empty state to prevent crashes
        setData({
          weeklyData: [],
          monthlyData: [],
          triggerFrequencies: [],
          bodyAreas: [],
          recentEpisodes: [],
          allEpisodes: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-3xl font-bold">SweatSmart Dashboard</h1>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="col-span-3 h-[300px] animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">SweatSmart Dashboard</h1>
          <div className="text-center py-12">
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-destructive">Unable to load dashboard</h3>
              <p className="text-muted-foreground">
                {error || "Something went wrong. Please refresh the page."}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">SweatSmart Dashboard</h1>
          {data.allEpisodes.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Total episodes: {data.allEpisodes.length}
            </div>
          )}
        </div>
        
        <QuickActions />
        
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardSummary 
            weeklyData={data.weeklyData} 
            monthlyData={data.monthlyData}
            allEpisodes={data.allEpisodes}
          />
          
          <TriggerSummary 
            triggers={data.triggerFrequencies}
            allEpisodes={data.allEpisodes}
          />
          
          <BodyAreaHeatmap 
            bodyAreas={data.bodyAreas}
          />
          
          <RecentEpisodes episodes={data.recentEpisodes} />
        </div>
        
        {data.allEpisodes.length === 0 && (
          <div className="text-center py-12">
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xl font-medium">Welcome to SweatSmart!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start tracking your hyperhidrosis episodes to unlock personalized insights and patterns.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
