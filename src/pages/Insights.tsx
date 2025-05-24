
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TriggerFrequency, BodyAreaFrequency } from "@/types";
import { Thermometer, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Insights = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    topTriggers: TriggerFrequency[];
    bodyAreaFrequencies: BodyAreaFrequency[];
    recommendations: any[];
    treatments: any[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRealInsights = async () => {
      if (!user) return;
      
      try {
        // Fetch real episodes from database
        const { data: episodes, error } = await supabase
          .from('episodes')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching episodes:', error);
        }
        
        // Initialize with empty data - will be populated as user logs episodes
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
        
        setData({
          topTriggers: [],
          bodyAreaFrequencies: [],
          recommendations: [],
          treatments,
        });
      } catch (error) {
        console.error('Error fetching insights:', error);
        setData({
          topTriggers: [],
          bodyAreaFrequencies: [],
          recommendations: [],
          treatments: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealInsights();
  }, [user]);
  
  if (isLoading || !data) {
    return (
      <AppLayout>
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
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Insights & Recommendations</h1>
        </div>
        
        <Alert className="bg-primary/10 border-primary/20">
          <Thermometer className="h-4 w-4 text-primary" />
          <AlertTitle>Personalized Insights</AlertTitle>
          <AlertDescription>
            Start logging episodes to see personalized insights and trigger patterns. Your data will help identify what may be affecting your hyperhidrosis.
          </AlertDescription>
        </Alert>
        
        {data.topTriggers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Data Yet</CardTitle>
              <CardDescription>
                Log some episodes to start seeing your personal triggers and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Once you've logged a few episodes, you'll see insights about your most common triggers and affected body areas.
              </p>
            </CardContent>
          </Card>
        ) : (
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
        )}
        
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
