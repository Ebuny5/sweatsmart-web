
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays } from "date-fns";
import { Episode, BodyArea, Trigger } from "@/types";
import { Search, Calendar, Filter } from "lucide-react";

// Generate mock episodes for demo
const generateMockEpisodes = (): Episode[] => {
  return Array.from({ length: 20 }).map((_, i) => {
    const date = subDays(new Date(), i);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    
    const severity = Math.floor(Math.random() * 5) + 1;
    
    const bodyAreaOptions: BodyArea[] = ["palms", "soles", "face", "armpits", "head", "back", "groin", "entireBody"];
    const bodyAreaCount = Math.floor(Math.random() * 3) + 1;
    const bodyAreas = bodyAreaOptions
      .sort(() => 0.5 - Math.random())
      .slice(0, bodyAreaCount);
    
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
    
    const triggerCount = Math.floor(Math.random() * 3);
    const triggers = triggerOptions
      .sort(() => 0.5 - Math.random())
      .slice(0, triggerCount);
    
    return {
      id: `episode-${i}`,
      userId: "user-1",
      datetime: date,
      severityLevel: severity as any,
      bodyAreas,
      triggers,
      notes: i % 3 === 0 ? "This happened after my morning coffee." : undefined,
      createdAt: date,
    };
  });
};

const History = () => {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [bodyAreaFilter, setBodyAreaFilter] = useState<string>("");
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const mockEpisodes = generateMockEpisodes();
      setEpisodes(mockEpisodes);
      setFilteredEpisodes(mockEpisodes);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  useEffect(() => {
    let result = episodes;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (episode) =>
          episode.notes?.toLowerCase().includes(term) ||
          episode.triggers.some((trigger) =>
            trigger.label.toLowerCase().includes(term)
          ) ||
          episode.bodyAreas.some((area) => area.toLowerCase().includes(term))
      );
    }
    
    // Apply severity filter
    if (severityFilter) {
      result = result.filter(
        (episode) => episode.severityLevel.toString() === severityFilter
      );
    }
    
    // Apply body area filter
    if (bodyAreaFilter) {
      result = result.filter((episode) =>
        episode.bodyAreas.includes(bodyAreaFilter as BodyArea)
      );
    }
    
    setFilteredEpisodes(result);
  }, [episodes, searchTerm, severityFilter, bodyAreaFilter]);
  
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
    if (areas.length === 0) return "None";
    return areas.join(", ");
  };
  
  const resetFilters = () => {
    setSearchTerm("");
    setSeverityFilter("");
    setBodyAreaFilter("");
  };
  
  return (
    <AppLayout isAuthenticated={true} userName="John Doe">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Episode History</h1>
          <Button onClick={() => navigate("/log-episode")}>Log New Episode</Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Filter Episodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes or triggers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Severities</SelectItem>
                    <SelectItem value="1">Level 1 (Mild)</SelectItem>
                    <SelectItem value="2">Level 2 (Moderate)</SelectItem>
                    <SelectItem value="3">Level 3 (Medium)</SelectItem>
                    <SelectItem value="4">Level 4 (Severe)</SelectItem>
                    <SelectItem value="5">Level 5 (Extreme)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={bodyAreaFilter} onValueChange={setBodyAreaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Body Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Body Areas</SelectItem>
                    <SelectItem value="palms">Palms</SelectItem>
                    <SelectItem value="soles">Feet Soles</SelectItem>
                    <SelectItem value="face">Face</SelectItem>
                    <SelectItem value="armpits">Armpits</SelectItem>
                    <SelectItem value="head">Scalp/Head</SelectItem>
                    <SelectItem value="back">Back</SelectItem>
                    <SelectItem value="groin">Groin</SelectItem>
                    <SelectItem value="entireBody">Entire Body</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Reset Filters</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : filteredEpisodes.length > 0 ? (
          <div className="space-y-4">
            {filteredEpisodes.map((episode) => (
              <Card
                key={episode.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/episode/${episode.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(
                              new Date(episode.datetime),
                              "MMM d, yyyy • h:mm a"
                            )}
                          </span>
                        </div>
                        <h3 className="font-medium mt-1">
                          {formatBodyAreas(episode.bodyAreas)}
                        </h3>
                        {episode.notes && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {episode.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getSeverityColor(episode.severityLevel)}>
                        Level {episode.severityLevel}
                      </Badge>
                      
                      {episode.triggers.map((trigger) => (
                        <Badge
                          key={trigger.value}
                          variant="outline"
                          className="bg-background"
                        >
                          {trigger.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-lg font-medium">No episodes found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your filters or log your first episode.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate("/log-episode")}
            >
              Log New Episode
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default History;
