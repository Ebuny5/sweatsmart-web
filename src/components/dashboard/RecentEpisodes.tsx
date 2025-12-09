import { ProcessedEpisode } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecentEpisodesProps {
  episodes: ProcessedEpisode[];
}

const RecentEpisodes: React.FC<RecentEpisodesProps> = ({ episodes }) => {
  const navigate = useNavigate();
  
  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
        return "bg-orange-100 text-orange-800";
      case 5:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const formatBodyAreas = (areas: string[]) => {
    if (areas.length === 0) return "None";
    if (areas.length === 1) return areas[0];
    if (areas.length === 2) return areas.join(" and ");
    return `${areas[0]}, ${areas[1]}, and ${areas.length - 2} more`;
  };
  
  return (
    <Card className="col-span-3 lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Episodes</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => navigate("/history")}
        >
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {episodes.length > 0 ? (
            episodes.map((episode) => (
              <div 
                key={episode.id} 
                className="flex flex-col p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/episode/${episode.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(episode.datetime, "MMM d, yyyy • h:mm a")}
                    </span>
                  </div>
                  <Badge className={getSeverityColor(episode.severityLevel)}>
                    Level {episode.severityLevel}
                  </Badge>
                </div>
                <div className="text-sm">
                  <div className="font-medium">
                    Affected areas: <span className="font-normal">{formatBodyAreas(episode.bodyAreas)}</span>
                  </div>
                  {episode.triggers.length > 0 && (
                    <div className="font-medium mt-1">
                      Triggers: <span className="font-normal">
                        {episode.triggers
                          .slice(0, 2)
                          .map(t => t?.label || t?.value || 'Unknown')
                          .join(", ")}
                        {episode.triggers.length > 2 ? ` and ${episode.triggers.length - 2} more` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No episodes recorded yet.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => navigate("/log-episode")}
              >
                Log your first episode
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentEpisodes;