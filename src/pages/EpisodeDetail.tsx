
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import EpisodeInsights from "@/components/episode/EpisodeInsights";
import { useEpisodes } from "@/hooks/useEpisodes";

const EpisodeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { episodes, loading } = useEpisodes();

  const episode = episodes.find(ep => ep.id === id);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!episode) {
    return (
      <AppLayout>
        <div className="space-y-4 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center py-8 sm:py-12">
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Episode not found</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              The episode you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/history')} className="w-full sm:w-auto">
              Back to History
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getSeverityColor = (level: number) => {
    const colors = {
      1: "bg-green-100 text-green-800",
      2: "bg-yellow-100 text-yellow-800", 
      3: "bg-orange-100 text-orange-800",
      4: "bg-red-100 text-red-800",
      5: "bg-purple-100 text-purple-800"
    };
    return colors[level as keyof typeof colors] || colors[3];
  };

  const getSeverityLabel = (level: number) => {
    const labels = {
      1: "Mild",
      2: "Moderate",
      3: "Medium", 
      4: "Severe",
      5: "Extreme"
    };
    return labels[level as keyof typeof labels] || "Medium";
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/history')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to History</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Episode Details</h1>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  {format(episode.datetime, "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {format(episode.datetime, "h:mm a")}
                </CardDescription>
              </div>
              <Badge className={`${getSeverityColor(episode.severityLevel)} text-sm font-medium w-fit`}>
                Severity: {getSeverityLabel(episode.severityLevel)} ({episode.severityLevel}/5)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 pt-0">
            {/* Body Areas */}
            <div>
              <h3 className="font-medium text-sm sm:text-base mb-2">Affected Body Areas</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {episode.bodyAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs sm:text-sm">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Triggers */}
            {episode.triggers.length > 0 && (
              <div>
                <h3 className="font-medium text-sm sm:text-base mb-2">Triggers</h3>
                <div className="space-y-2">
                  {episode.triggers.map((trigger, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg">
                      <span className="text-sm sm:text-base">{trigger.label}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {trigger.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {episode.notes && (
              <div>
                <h3 className="font-medium text-sm sm:text-base mb-2">Additional Notes</h3>
                <p className="text-sm sm:text-base text-muted-foreground p-3 bg-muted rounded-lg leading-relaxed">
                  {episode.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <EpisodeInsights episode={episode} />
      </div>
    </AppLayout>
  );
};

export default EpisodeDetail;
