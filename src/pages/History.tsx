
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Filter, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Episode, SeverityLevel, BodyArea } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

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
        } else {
          const processedEpisodes: Episode[] = (data || []).map(ep => ({
            id: ep.id,
            userId: ep.user_id,
            datetime: new Date(ep.date),
            severityLevel: ep.severity as SeverityLevel,
            bodyAreas: (ep.body_areas || []) as BodyArea[],
            triggers: Array.isArray(ep.triggers) ? ep.triggers.map(t => {
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
            notes: ep.notes,
            createdAt: new Date(ep.created_at),
          }));
          setEpisodes(processedEpisodes);
        }
      } catch (error) {
        console.error('Error fetching episodes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [user]);

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

  const filteredAndSortedEpisodes = episodes
    .filter(episode => {
      const matchesSearch = episode.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          episode.bodyAreas.some(area => area.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          episode.triggers.some(trigger => trigger.label.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSeverity = severityFilter === "all" || episode.severityLevel.toString() === severityFilter;
      
      return matchesSearch && matchesSeverity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.datetime.getTime() - b.datetime.getTime();
        case "severity-high":
          return b.severityLevel - a.severityLevel;
        case "severity-low":
          return a.severityLevel - b.severityLevel;
        default: // newest
          return b.datetime.getTime() - a.datetime.getTime();
      }
    });

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Episode History</h1>
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse bg-muted rounded-lg" />
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
          <h1 className="text-3xl font-bold">Episode History</h1>
          <Button onClick={() => navigate("/log-episode")}>
            Log New Episode
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
            <CardDescription>
              Find specific episodes using the filters below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search episodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Severity Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="1">Mild (1)</SelectItem>
                  <SelectItem value="2">Moderate (2)</SelectItem>
                  <SelectItem value="3">Medium (3)</SelectItem>
                  <SelectItem value="4">Severe (4)</SelectItem>
                  <SelectItem value="5">Extreme (5)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="severity-high">Highest Severity</SelectItem>
                  <SelectItem value="severity-low">Lowest Severity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredAndSortedEpisodes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Episodes Found</h3>
                <p className="text-muted-foreground mb-4">
                  {episodes.length === 0 
                    ? "You haven't logged any episodes yet. Start by logging your first episode!"
                    : "No episodes match your current filters. Try adjusting your search criteria."
                  }
                </p>
                <Button onClick={() => navigate("/log-episode")}>
                  Log Your First Episode
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedEpisodes.map((episode) => (
              <Card key={episode.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/episode/${episode.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">
                          {format(episode.datetime, "EEEE, MMMM d, yyyy")}
                        </h3>
                        <Badge className={getSeverityColor(episode.severityLevel)}>
                          {getSeverityLabel(episode.severityLevel)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(episode.datetime, "h:mm a")}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {episode.bodyAreas.slice(0, 3).map((area) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {episode.bodyAreas.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{episode.bodyAreas.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {episode.notes && (
                        <p className="text-sm text-muted-foreground truncate">
                          {episode.notes}
                        </p>
                      )}
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default History;
