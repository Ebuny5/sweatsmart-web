
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TriggerFrequency, BodyAreaFrequency, Trigger } from "@/types";
import { Thermometer, AlertCircle } from "lucide-react";

// Generate mock insights data
const generateMockInsights = () => {
  const triggerOptions: Trigger[] = [
    { type: "environmental", value: "hotTemperature", label: "Hot Temperature" },
    { type: "environmental", value: "highHumidity", label: "High Humidity" },
    { type: "emotional", value: "stress", label: "Stress" },
    { type: "emotional", value: "anxiety", label: "Anxiety" },
    { type: "dietary", value: "caffeine", label: "Caffeine" },
    { type: "dietary", value: "spicyFood", label: "Spicy Food" },
    { type: "activity", value: "physicalExercise", label: "Physical Exercise" },
    { type: "activity", value: "socialEvents", label: "Social Events" },
  ];
  
  const topTriggers: TriggerFrequency[] = triggerOptions
    .map(trigger => ({
      trigger,
      count: Math.floor(Math.random() * 15) + 1,
      averageSeverity: 1 + Math.random() * 4,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  const bodyAreaFrequencies: BodyAreaFrequency[] = [
    { area: "palms", count: 15, averageSeverity: 3.8 },
    { area: "armpits", count: 12, averageSeverity: 4.2 },
    { area: "face", count: 8, averageSeverity: 3.1 },
  ];
  
  const recommendations = [
    {
      id: 1,
      type: "environmental",
      trigger: "Hot Temperature",
      advice: "Consider using cooling wristbands or neck wraps when in hot environments. Stay hydrated and opt for loose, breathable clothing made from natural fabrics like cotton or linen.",
    },
    {
      id: 2,
      type: "emotional",
      trigger: "Stress",
      advice: "Practice deep breathing exercises or mindfulness meditation for 5-10 minutes before stressful situations. Progressive muscle relaxation may also help reduce stress-triggered sweating.",
    },
    {
      id: 3,
      type: "dietary",
      trigger: "Caffeine",
      advice: "Try gradually reducing caffeine intake or switching to decaffeinated alternatives. Monitor your response to different caffeinated beverages - some people find tea less triggering than coffee.",
    },
    {
      id: 4,
      type: "activity",
      trigger: "Physical Exercise",
      advice: "Consider exercising in cooler environments (early morning or evening), wearing moisture-wicking fabrics, and using antiperspirant before workouts. Keep a cooling towel handy.",
    },
  ];
  
  const treatments = [
    {
      id: 1,
      name: "Clinical-strength antiperspirants",
      description: "Over-the-counter or prescription antiperspirants containing higher concentrations of aluminum chloride can help block sweat ducts.",
      suitability: "Mild to moderate hyperhidrosis",
    },
    {
      id: 2,
      name: "Iontophoresis",
      description: "A medical device delivers a low-level electrical current through water to temporarily block sweat glands.",
      suitability: "Moderate to severe hyperhidrosis affecting hands, feet",
    },
    {
      id: 3,
      name: "Botulinum toxin (Botox) injections",
      description: "Botox injections temporarily block the nerves that stimulate sweat glands.",
      suitability: "Severe hyperhidrosis, particularly underarms",
    },
    {
      id: 4,
      name: "Anticholinergic medications",
      description: "Oral medications that block the chemical messenger that activates sweat glands.",
      suitability: "Widespread or severe hyperhidrosis",
    },
  ];
  
  return {
    topTriggers,
    bodyAreaFrequencies,
    recommendations,
    treatments,
  };
};

const Insights = () => {
  const [data, setData] = useState<{
    topTriggers: TriggerFrequency[];
    bodyAreaFrequencies: BodyAreaFrequency[];
    recommendations: any[];
    treatments: any[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(generateMockInsights());
      setIsLoading(false);
    }, 1000);
  }, []);
  
  if (isLoading || !data) {
    return (
      <AppLayout isAuthenticated={true} userName="John Doe">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Insights & Recommendations</h1>
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[200px] animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout isAuthenticated={true} userName="John Doe">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Insights & Recommendations</h1>
        </div>
        
        <Alert className="bg-primary/10 border-primary/20">
          <Thermometer className="h-4 w-4 text-primary" />
          <AlertTitle>Personalized Insights</AlertTitle>
          <AlertDescription>
            Based on your logged episodes, we've identified patterns and potential triggers that may be affecting your hyperhidrosis.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Top Triggers</CardTitle>
              <CardDescription>
                These factors appear most frequently in your episodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topTriggers.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.trigger.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.count} episodes • Avg. severity: {item.averageSeverity.toFixed(1)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10">
                      {item.trigger.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Most Affected Areas</CardTitle>
              <CardDescription>
                Body areas most frequently impacted by sweating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.bodyAreaFrequencies.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium capitalize">{item.area}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.count} episodes • Avg. severity: {item.averageSeverity.toFixed(1)}
                      </p>
                    </div>
                    <div className="w-16 h-4 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(item.averageSeverity / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Personalized Recommendations</CardTitle>
            <CardDescription>
              Based on your triggers, here are some strategies that may help
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recommendations.map((rec) => (
                <div key={rec.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">
                      {rec.type}
                    </Badge>
                    <div>
                      <h3 className="font-medium">{rec.trigger}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.advice}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Treatment Options</CardTitle>
            <CardDescription>
              Evidence-based treatments for hyperhidrosis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Medical Disclaimer</AlertTitle>
              <AlertDescription>
                This information is for educational purposes only and is not intended as medical advice. Always consult with a healthcare provider before starting any treatment.
              </AlertDescription>
            </Alert>
            
            <Tabs defaultValue="clinical">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="clinical">Clinical Options</TabsTrigger>
                <TabsTrigger value="self">Self-Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="clinical">
                <div className="space-y-4">
                  {data.treatments.map((treatment) => (
                    <div key={treatment.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium">{treatment.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {treatment.description}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Best for: {treatment.suitability}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="self">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Clothing Choices</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Opt for loose-fitting, breathable fabrics like cotton, linen, or moisture-wicking materials. Consider wearing darker colors or patterns that can help hide sweat marks.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Stress Management</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Practice relaxation techniques like deep breathing, meditation, or yoga. Cognitive behavioral therapy (CBT) can also help manage anxiety that may trigger sweating.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Diet Modifications</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consider reducing intake of spicy foods, caffeine, and alcohol, which can trigger sweating in some individuals. Stay well-hydrated with cool water.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Temperature Regulation</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use cooling products like wristbands, neck wraps, or portable fans. Layer clothing to adjust to changing temperatures throughout the day.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Insights;
