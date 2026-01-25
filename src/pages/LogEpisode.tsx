import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import SeveritySelector from "@/components/episode/SeveritySelector";
import BodyAreaSelector from "@/components/episode/BodyAreaSelector";
import TriggerSelector from "@/components/episode/TriggerSelector";
import AIGeneratedInsights from "@/components/episode/AIGeneratedInsights";
import { SeverityLevel, BodyArea, Trigger } from "@/types";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateFallbackInsights } from "@/services/EpisodeInsightGenerator";

const LogEpisode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const isNow = searchParams.get("now") === "true";
  
  // Episode state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>(
    format(new Date(), "HH:mm")
  );
  const [severity, setSeverity] = useState<SeverityLevel>(3);
  const [bodyAreas, setBodyAreas] = useState<BodyArea[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
  
  useEffect(() => {
    if (isNow) {
      // Pre-fill with current time if "log now" was clicked
      setDate(new Date());
      setTime(format(new Date(), "HH:mm"));
    }
  }, [isNow]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save episodes.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for the episode.",
        variant: "destructive",
      });
      return;
    }
    
    if (bodyAreas.length === 0) {
      toast({
        title: "Body areas required",
        description: "Please select at least one affected body area.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Combine date and time
    const [hours, minutes] = time.split(':').map(Number);
    const datetime = new Date(date);
    datetime.setHours(hours, minutes);
    
    try {
      // Convert trigger objects to JSON strings for storage
      const triggerStrings = triggers.map(trigger => JSON.stringify({
        type: trigger.type,
        value: trigger.value,
        label: trigger.label
      }));

      const { error } = await supabase
        .from('episodes')
        .insert({
          user_id: user.id,
          severity: severity,
          body_areas: bodyAreas,
          triggers: triggerStrings,
          notes: notes || null,
          date: datetime.toISOString(),
        });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Episode logged successfully",
        description: "Generating personalized insights...",
      });
      
      // Generate AI insights with fallback
      setIsLoadingInsights(true);
      try {
        const triggerData = triggers.map(t => ({ type: t.type, value: t.value, label: t.label }));
        
        // Try Gemini API first
        const { data: insightsData, error: insightsError } = await supabase.functions.invoke(
          'generate-episode-insights',
          {
            body: {
              severity,
              bodyAreas,
              triggers: triggerData,
              notes
            }
          }
        );

        if (insightsError || !insightsData?.insights) {
          console.log('Gemini API failed, using fallback insight generator');
          // Use fallback rule-based insights
          const fallbackInsights = generateFallbackInsights(severity, bodyAreas, triggerData, notes);
          setAiInsights(fallbackInsights);
          toast({
            title: "Insights generated",
            description: "Your personalized insights are ready.",
          });
        } else {
          setAiInsights(insightsData.insights);
        }
      } catch (insightError) {
        console.error('Error calling insights function, using fallback:', insightError);
        // Fallback to rule-based insights
        const triggerData = triggers.map(t => ({ type: t.type, value: t.value, label: t.label }));
        const fallbackInsights = generateFallbackInsights(severity, bodyAreas, triggerData, notes);
        setAiInsights(fallbackInsights);
        toast({
          title: "Insights generated",
          description: "Your personalized insights are ready.",
        });
      } finally {
        setIsLoadingInsights(false);
        setShowInsights(true);
      }
    } catch (error) {
      console.error('Error saving episode:', error);
      toast({
        title: "Failed to log episode",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (showInsights) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Episode Logged Successfully!</h1>
          
          <div className="space-y-6">
            {isLoadingInsights ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Generating personalized medical insights...</p>
                    <p className="text-sm text-muted-foreground">This may take a few moments</p>
                  </div>
                </CardContent>
              </Card>
            ) : aiInsights ? (
              <AIGeneratedInsights insights={aiInsights} />
            ) : (
              <Card>
                <CardContent className="py-6">
                  <p className="text-muted-foreground text-center">
                    Episode saved, but insights could not be generated. Please check your history for the logged episode.
                  </p>
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset form for new episode
                  setDate(new Date());
                  setTime(format(new Date(), "HH:mm"));
                  setSeverity(3);
                  setBodyAreas([]);
                  setTriggers([]);
                  setNotes("");
                  setShowInsights(false);
                  setAiInsights(null);
                }}
              >
                Log Another Episode
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/history")}>
                View History
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Log Sweating Episode</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
                <CardDescription>
                  When did this episode occur?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => date > new Date()}
                          className="p-3"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-[150px]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Symptom Details</CardTitle>
                <CardDescription>
                  How would you describe this episode?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SeveritySelector value={severity} onChange={setSeverity} />
                
                <BodyAreaSelector
                  selectedAreas={bodyAreas}
                  onChange={setBodyAreas}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any other details about this episode..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
            
            <TriggerSelector
              triggers={triggers}
              onTriggersChange={setTriggers}
            />
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Episode"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default LogEpisode;
