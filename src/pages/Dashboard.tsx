
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentEpisodes from "@/components/dashboard/RecentEpisodes";
import TriggerSummary from "@/components/dashboard/TriggerSummary";
import BodyAreaHeatmap from "@/components/dashboard/BodyAreaHeatmap";
import QuickActions from "@/components/dashboard/QuickActions";
import { TrendData, Episode, TriggerFrequency, BodyAreaFrequency } from "@/types";
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
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRealData = async () => {
      if (!user) return;
      
      try {
        // Fetch real episodes from database
        const { data: episodes, error } = await supabase
          .from('episodes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching episodes:', error);
          // Initialize with empty data if no episodes found
          setData({
            weeklyData: [],
            monthlyData: [],
            triggerFrequencies: [],
            bodyAreas: [],
            recentEpisodes: [],
          });
        } else {
          // Process real data
          const recentEpisodes: Episode[] = (episodes || []).map(ep => ({
            id: ep.id,
            userId: ep.user_id,
            datetime: new Date(ep.date),
            severityLevel: ep.severity,
            bodyAreas: ep.body_areas || [],
            triggers: JSON.parse(ep.triggers || '[]'),
            notes: ep.notes,
            createdAt: new Date(ep.created_at),
          }));
          
          setData({
            weeklyData: [],
            monthlyData: [],
            triggerFrequencies: [],
            bodyAreas: [],
            recentEpisodes,
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <QuickActions />
        
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardSummary 
            weeklyData={data.weeklyData} 
            monthlyData={data.monthlyData} 
          />
          
          <TriggerSummary triggers={data.triggerFrequencies} />
          
          <BodyAreaHeatmap bodyAreas={data.bodyAreas} />
          
          <RecentEpisodes episodes={data.recentEpisodes} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
