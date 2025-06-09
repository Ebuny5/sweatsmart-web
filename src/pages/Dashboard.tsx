
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentEpisodes from "@/components/dashboard/RecentEpisodes";
import TriggerSummary from "@/components/dashboard/TriggerSummary";
import BodyAreaHeatmap from "@/components/dashboard/BodyAreaHeatmap";
import QuickActions from "@/components/dashboard/QuickActions";
import { TrendData, Episode, TriggerFrequency, BodyAreaFrequency, SeverityLevel, BodyArea } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    weeklyData: TrendData[];
    monthlyData: TrendData[];
    triggerFrequencies: TriggerFrequency[];
    bodyAreas: BodyAreaFrequency[];
    recentEpisodes: Episode[];
    allEpisodes: Episode[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRealData = async () => {
      if (!user) return;
      
      try {
        // Fetch ALL episodes from database for analytics
        const { data: episodes, error } = await supabase
          .from('episodes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching episodes:', error);
          setData({
            weeklyData: [],
            monthlyData: [],
            triggerFrequencies: [],
            bodyAreas: [],
            recentEpisodes: [],
            allEpisodes: [],
          });
        } else {
          // Process all episodes
          const allEpisodes: Episode[] = (episodes || []).map(ep => ({
            id: ep.id,
            userId: ep.user_id,
            datetime: new Date(ep.date),
            severityLevel: ep.severity as SeverityLevel,
            bodyAreas: (ep.body_areas || []) as BodyArea[],
            triggers: Array.isArray(ep.triggers) ? ep.triggers.map(t => {
              if (typeof t === 'string') {
                try {
                  const parsed = JSON.parse(t);
                  return {
                    type: parsed.type || 'environmental',
                    value: parsed.value || '',
                    label: parsed.label || ''
                  };
                } catch {
                  return {
                    type: 'environmental',
                    value: '',
                    label: t
                  };
                }
              }
              return {
                type: 'environmental',
                value: '',
                label: typeof t === 'string' ? t : ''
              };
            }) : [],
            notes: ep.notes,
            createdAt: new Date(ep.created_at),
          }));
          
          // Get recent episodes (last 5)
          const recentEpisodes = allEpisodes.slice(0, 5);
          
          // Generate body area data from episodes
          const bodyAreaCounts = new Map();
          const bodyAreaSeverities = new Map();
          
          allEpisodes.forEach(episode => {
            episode.bodyAreas.forEach(area => {
              if (!bodyAreaCounts.has(area)) {
                bodyAreaCounts.set(area, 0);
                bodyAreaSeverities.set(area, []);
              }
              bodyAreaCounts.set(area, bodyAreaCounts.get(area) + 1);
              bodyAreaSeverities.get(area).push(episode.severityLevel);
            });
          });

          const bodyAreas: BodyAreaFrequency[] = Array.from(bodyAreaCounts.entries()).map(([area, count]) => {
            const severities = bodyAreaSeverities.get(area);
            const averageSeverity = severities.reduce((a: number, b: number) => a + b, 0) / severities.length;
            
            return {
              area,
              count,
              averageSeverity
            };
          });
          
          setData({
            weeklyData: [],
            monthlyData: [],
            triggerFrequencies: [],
            bodyAreas,
            recentEpisodes,
            allEpisodes,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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

    fetchRealData();
  }, [user]);
  
  if (isLoading || !data) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="col-span-3 h-[350px] animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
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
            <div className="space-y-4">
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
