
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import RecentEpisodes from "@/components/dashboard/RecentEpisodes";
import TriggerSummary from "@/components/dashboard/TriggerSummary";
import BodyAreaHeatmap from "@/components/dashboard/BodyAreaHeatmap";
import QuickActions from "@/components/dashboard/QuickActions";
import { TrendData, Episode, TriggerFrequency, BodyAreaFrequency, Trigger, BodyArea } from "@/types";
import { format, subDays } from "date-fns";

// Mock data generator for demo purposes
const generateMockData = () => {
  // Weekly trend data
  const weeklyData: TrendData[] = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, "MMM d"),
      averageSeverity: 1 + Math.random() * 4,
      episodeCount: Math.floor(Math.random() * 4),
    };
  });
  
  // Monthly trend data
  const monthlyData: TrendData[] = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, "MMM d"),
      averageSeverity: 1 + Math.random() * 4,
      episodeCount: Math.floor(Math.random() * 3),
    };
  });
  
  // Generate trigger frequencies
  const triggerOptions: Trigger[] = [
    { type: "environmental", value: "hotTemperature", label: "Hot temperature" },
    { type: "environmental", value: "highHumidity", label: "High humidity" },
    { type: "emotional", value: "stress", label: "Stress" },
    { type: "emotional", value: "anxiety", label: "Anxiety" },
    { type: "dietary", value: "caffeine", label: "Caffeine" },
    { type: "dietary", value: "spicyFood", label: "Spicy food" },
    { type: "activity", value: "physicalExercise", label: "Exercise" },
    { type: "activity", value: "socialEvents", label: "Social events" },
  ];
  
  const triggerFrequencies: TriggerFrequency[] = triggerOptions.map(trigger => ({
    trigger,
    count: Math.floor(Math.random() * 15) + 1,
    averageSeverity: 1 + Math.random() * 4,
  })).sort((a, b) => b.count - a.count);
  
  // Generate body area frequencies
  const bodyAreas: BodyAreaFrequency[] = [
    { area: "palms" as BodyArea, count: Math.floor(Math.random() * 20) + 5, averageSeverity: 1 + Math.random() * 4 },
    { area: "armpits" as BodyArea, count: Math.floor(Math.random() * 20) + 5, averageSeverity: 1 + Math.random() * 4 },
    { area: "face" as BodyArea, count: Math.floor(Math.random() * 20) + 5, averageSeverity: 1 + Math.random() * 4 },
    { area: "back" as BodyArea, count: Math.floor(Math.random() * 15), averageSeverity: 1 + Math.random() * 4 },
    { area: "soles" as BodyArea, count: Math.floor(Math.random() * 15), averageSeverity: 1 + Math.random() * 4 },
    { area: "groin" as BodyArea, count: Math.floor(Math.random() * 10), averageSeverity: 1 + Math.random() * 4 },
  ].sort((a, b) => b.count - a.count);
  
  // Generate recent episodes
  const recentEpisodes: Episode[] = Array.from({ length: 5 }).map((_, i) => {
    const date = subDays(new Date(), i);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    
    const severity = Math.floor(Math.random() * 5) + 1;
    const bodyAreaCount = Math.floor(Math.random() * 3) + 1;
    const bodyAreasList = ["palms", "soles", "face", "armpits", "head", "back", "groin"] as BodyArea[];
    const selectedBodyAreas = bodyAreasList
      .sort(() => 0.5 - Math.random())
      .slice(0, bodyAreaCount);
    
    const triggerCount = Math.floor(Math.random() * 3) + 1;
    const selectedTriggers = triggerOptions
      .sort(() => 0.5 - Math.random())
      .slice(0, triggerCount);
    
    return {
      id: `episode-${i}`,
      userId: "user-1",
      datetime: date,
      severityLevel: severity as any,
      bodyAreas: selectedBodyAreas,
      triggers: selectedTriggers,
      notes: i % 2 === 0 ? "I noticed this happened after my morning coffee." : undefined,
      createdAt: date,
    };
  });
  
  return {
    weeklyData,
    monthlyData,
    triggerFrequencies,
    bodyAreas,
    recentEpisodes,
  };
};

const Dashboard = () => {
  const [data, setData] = useState<{
    weeklyData: TrendData[];
    monthlyData: TrendData[];
    triggerFrequencies: TriggerFrequency[];
    bodyAreas: BodyAreaFrequency[];
    recentEpisodes: Episode[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(generateMockData());
      setIsLoading(false);
    }, 1000);
  }, []);
  
  if (isLoading || !data) {
    return (
      <AppLayout isAuthenticated={true} userName="John Doe">
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
    <AppLayout isAuthenticated={true} userName="John Doe">
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
