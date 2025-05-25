
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, MapPin, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";
import { Episode, SeverityLevel, BodyArea } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const EpisodeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEpisode = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('episodes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching episode:', error);
        } else if (data) {
          const processedEpisode: Episode = {
            id: data.id,
            userId: data.user_id,
            datetime: new Date(data.date),
            severityLevel: data.severity as SeverityLevel,
            bodyAreas: (data.body_areas || []) as BodyArea[],
            triggers: Array.isArray(data.triggers) ? data.triggers.map(t => {
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
            notes: data.notes,
            createdAt: new Date(data.created_at),
          };
          setEpisode(processedEpisode);
        }
      } catch (error) {
        console.error('Error fetching episode:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisode();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!episode) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Episode Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The episode you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate("/history")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Button>
        </div>
      </AppLayout>
    );
  }

  const getSeverityColor = (level: SeverityLevel) => {
    const colors = {
      1: "bg-green-100 text-green-800",
      2: "bg-yellow-100 text-yellow-800", 
      3: "bg-orange-100 text-orange-800",
      4: "bg-red-100 text-red-800",
      5: "bg-purple-100 text-purple-800"
    };
    return colors[level] || colors[3];
  };

  const getSeverityLabel = (level: SeverityLevel) => {
    const labels = {
      1: "Mild",
      2: "Moderate",
      3: "Medium", 
      4: "Severe",
      5: "Extreme"
    };
    return labels[level] || "Medium";
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/history")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Episode Details
                </CardTitle>
                <Badge className={getSeverityColor(episode.severityLevel)}>
                  {getSeverityLabel(episode.severityLevel)} (Level {episode.severityLevel})
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(episode.datetime, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(episode.datetime, "h:mm a")}
                  </span>
                </div>
              </div>

              {episode.bodyAreas.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Affected Body Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {episode.bodyAreas.map((area) => (
                      <Badge key={area} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {episode.triggers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Potential Triggers
                  </h3>
                  <div className="space-y-2">
                    {episode.triggers.map((trigger, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {trigger.type}
                        </Badge>
                        <span className="text-sm">{trigger.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {episode.notes && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {episode.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{episode.severityLevel}</div>
                  <div className="text-sm text-muted-foreground">Severity Level</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{episode.bodyAreas.length}</div>
                  <div className="text-sm text-muted-foreground">Body Areas</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{episode.triggers.length}</div>
                  <div className="text-sm text-muted-foreground">Triggers</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EpisodeDetail;
