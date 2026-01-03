
import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentEpisodes from "@/components/dashboard/RecentEpisodes";
import TriggerSummary from "@/components/dashboard/TriggerSummary";
import BodyAreaHeatmap from "@/components/dashboard/BodyAreaHeatmap";
import QuickActions from "@/components/dashboard/QuickActions";
import { TriggerFrequency, BodyAreaFrequency, BodyArea } from "@/types";
import { useEpisodes } from "@/hooks/useEpisodes";

const Dashboard = () => {
  const { episodes: allEpisodes, loading: isLoading, error, refetch } = useEpisodes();
  
  const dashboardData = useMemo(() => {
    console.log('Processing dashboard data for', allEpisodes.length, 'episodes');
    
    const recentEpisodes = allEpisodes.slice(0, 5);
    
    const triggerCounts = new Map<string, { count: number; severities: number[] }>();
    
    allEpisodes.forEach(episode => {
      if (episode.triggers && Array.isArray(episode.triggers)) {
        episode.triggers.forEach(trigger => {
          if (trigger && (trigger.label || trigger.value)) {
            const key = trigger.label || trigger.value || 'Unknown';
            const existing = triggerCounts.get(key) || { count: 0, severities: [] };
            existing.count += 1;
            existing.severities.push(episode.severityLevel);
            triggerCounts.set(key, existing);
          }
        });
      }
    });

    const triggerFrequencies: TriggerFrequency[] = Array.from(triggerCounts.entries()).map(([label, data]) => {
      const averageSeverity = data.severities.length > 0 
        ? data.severities.reduce((a, b) => a + b, 0) / data.severities.length
        : 0;
      
      return {
        name: label,
        category: 'environmental',
        count: data.count,
        trigger: {
          label,
          type: 'environmental' as const,
          value: label
        },
        averageSeverity,
        percentage: allEpisodes.length > 0 ? Math.round((data.count / allEpisodes.length) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
    
    const bodyAreaCounts = new Map<string, { count: number; severities: number[] }>();
    
    allEpisodes.forEach(episode => {
      if (episode.bodyAreas && Array.isArray(episode.bodyAreas)) {
        episode.bodyAreas.forEach(area => {
          const existing = bodyAreaCounts.get(area) || { count: 0, severities: [] };
          existing.count += 1;
          existing.severities.push(episode.severityLevel);
          bodyAreaCounts.set(area, existing);
        });
      }
    });

    const bodyAreas: BodyAreaFrequency[] = Array.from(bodyAreaCounts.entries()).map(([area, data]) => {
      const averageSeverity = data.severities.length > 0
        ? data.severities.reduce((a, b) => a + b, 0) / data.severities.length
        : 0;
        
      return {
        area: area as BodyArea,
        count: data.count,
        percentage: allEpisodes.length > 0 ? Math.round((data.count / allEpisodes.length) * 100) : 0,
        averageSeverity
      };
    }).sort((a, b) => b.count - a.count);
    
    return {
      triggerFrequencies,
      bodyAreas,
      recentEpisodes,
      allEpisodes,
    };
  }, [allEpisodes]);
  
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

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">SweatSmart Dashboard</h1>
          <div className="text-center py-12">
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-destructive">Unable to load dashboard</h3>
              <p className="text-muted-foreground">{error}</p>
              <button 
                onClick={refetch} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
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
          {dashboardData.allEpisodes.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Total episodes: {dashboardData.allEpisodes.length}
            </div>
          )}
        </div>
        
        <QuickActions />
        
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardSummary 
            weeklyData={[]} 
            monthlyData={[]}
            allEpisodes={dashboardData.allEpisodes}
          />
          
          <TriggerSummary 
            triggers={dashboardData.triggerFrequencies}
            allEpisodes={dashboardData.allEpisodes}
          />
          
          <BodyAreaHeatmap 
            bodyAreas={dashboardData.bodyAreas}
          />
          
          <RecentEpisodes episodes={dashboardData.recentEpisodes} />
        </div>
        
        {dashboardData.allEpisodes.length === 0 && (
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
