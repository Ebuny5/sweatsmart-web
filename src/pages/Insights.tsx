
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PersonalizedInsights from "@/components/insights/PersonalizedInsights";

const Insights = () => {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('episodes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching episodes:', error);
          setEpisodes([]);
        } else {
          setEpisodes(data || []);
        }
      } catch (error) {
        console.error('Error fetching episodes:', error);
        setEpisodes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEpisodes();
  }, [user]);
  
  if (isLoading) {
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
        
        {episodes.length === 0 ? (
          <Alert className="bg-primary/10 border-primary/20">
            <Thermometer className="h-4 w-4 text-primary" />
            <AlertTitle>Start Your Journey</AlertTitle>
            <AlertDescription>
              Log your first episode to begin seeing personalized insights and trigger patterns. Your data will help identify what may be affecting your hyperhidrosis.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="bg-green-50 border-green-200">
              <Thermometer className="h-4 w-4 text-green-600" />
              <AlertTitle>Your Personal Insights</AlertTitle>
              <AlertDescription>
                Based on your {episodes.length} logged episode{episodes.length !== 1 ? 's' : ''}, here are your personalized insights and recommendations.
              </AlertDescription>
            </Alert>
            
            <PersonalizedInsights episodes={episodes} />
          </>
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
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Clinical-strength antiperspirants</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Over-the-counter or prescription antiperspirants containing higher concentrations of aluminum chloride can help block sweat ducts.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Iontophoresis</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      A medical device delivers a low-level electrical current through water to temporarily block sweat glands.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Botulinum toxin (Botox) injections</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Botox injections temporarily block the nerves that stimulate sweat glands.
                    </p>
                  </div>
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
