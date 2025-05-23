
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Episode, BodyArea, Trigger } from "@/types";
import { Calendar, MapPin, Thermometer, Clock, ArrowLeft, Edit3 } from "lucide-react";

// Mock episode data (in a real app, this would come from an API)
const getMockEpisode = (id: string): Episode | null => {
  const episodes = [
    {
      id: "episode-0",
      userId: "user-1",
      datetime: new Date("2025-05-19T14:26:00"),
      severityLevel: 4 as any,
      bodyAreas: ["palms"] as BodyArea[],
      triggers: [],
      notes: undefined,
      createdAt: new Date("2025-05-19T14:26:00"),
    },
    {
      id: "episode-1",
      userId: "user-1",
      datetime: new Date("2025-05-16T04:25:00"),
      severityLevel: 4 as any,
      bodyAreas: ["entireBody", "palms"] as BodyArea[],
      triggers: [
        { type: "emotional", value: "stress", label: "Stress" },
        { type: "environmental", value: "highHumidity", label: "High Humidity" },
      ] as Trigger[],
      notes: undefined,
      createdAt: new Date("2025-05-16T04:25:00"),
    },
    // Add more episodes as needed
  ];
  
  return episodes.find(ep => ep.id === id) || null;
};

const EpisodeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Simulate API fetch
      setTimeout(() => {
        const mockEpisode = getMockEpisode(id);
        setEpisode(mockEpisode);
        setIsLoading(false);
      }, 500);
    }
  }, [id]);

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

  const formatBodyAreas = (areas: BodyArea[]) => {
    return areas.map(area => {
      switch (area) {
        case "palms": return "Palms";
        case "soles": return "Feet Soles";
        case "face": return "Face";
        case "armpits": return "Armpits";
        case "head": return "Scalp/Head";
        case "back": return "Back";
        case "groin": return "Groin";
        case "entireBody": return "Entire Body";
        default: return area;
      }
    }).join(", ");
  };

  if (isLoading) {
    return (
      <AppLayout isAuthenticated={true} userName="John Doe">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (!episode) {
    return (
      <AppLayout isAuthenticated={true} userName="John Doe">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/history")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Episode Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The episode you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/history")}>
                Return to History
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout isAuthenticated={true} userName="John Doe">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/history")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
            <h1 className="text-3xl font-bold">Episode Details</h1>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Episode
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(episode.datetime), "MMMM d, yyyy")}
              </CardTitle>
              <Badge className={getSeverityColor(episode.severityLevel)}>
                Level {episode.severityLevel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </h3>
                  <p className="text-muted-foreground">
                    {format(new Date(episode.datetime), "h:mm a")}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Affected Areas
                  </h3>
                  <p className="text-muted-foreground">
                    {formatBodyAreas(episode.bodyAreas)}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4" />
                    Severity Level
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(episode.severityLevel)}>
                      Level {episode.severityLevel}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {episode.severityLevel === 1 && "Mild"}
                      {episode.severityLevel === 2 && "Moderate"}
                      {episode.severityLevel === 3 && "Medium"}
                      {episode.severityLevel === 4 && "Severe"}
                      {episode.severityLevel === 5 && "Extreme"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Triggers</h3>
                  {episode.triggers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {episode.triggers.map((trigger) => (
                        <Badge key={trigger.value} variant="outline">
                          {trigger.label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No triggers identified</p>
                  )}
                </div>
                
                {episode.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {episode.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EpisodeDetail;
