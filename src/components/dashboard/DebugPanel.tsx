import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcessedEpisode } from "@/types";
import { Bug } from "lucide-react";

interface DebugPanelProps {
  episodes: ProcessedEpisode[];
}

const DebugPanel = ({ episodes }: DebugPanelProps) => {
  const validEpisodes = episodes.filter(ep => 
    ep.datetime && ep.datetime instanceof Date && !isNaN(ep.datetime.getTime())
  );
  
  const invalidEpisodes = episodes.filter(ep => 
    !ep.datetime || !(ep.datetime instanceof Date) || isNaN(ep.datetime.getTime())
  );

  return (
    <Card className="col-span-3 border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Bug className="h-5 w-5" />
          Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Episodes</p>
            <p className="text-2xl font-bold">{episodes.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valid Dates</p>
            <p className="text-2xl font-bold text-green-600">{validEpisodes.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invalid Dates</p>
            <p className="text-2xl font-bold text-red-600">{invalidEpisodes.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Chart Ready</p>
            <p className="text-2xl font-bold">
              {validEpisodes.length >= 2 ? '✅' : '❌'}
            </p>
          </div>
        </div>

        {validEpisodes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Sample Valid Episodes:</p>
            <div className="space-y-1 text-xs font-mono bg-white p-3 rounded border">
              {validEpisodes.slice(0, 3).map(ep => (
                <div key={ep.id} className="text-green-700">
                  {ep.id.slice(0, 8)}... | Date: {ep.datetime.toLocaleDateString()} | Severity: {ep.severityLevel}
                </div>
              ))}
            </div>
          </div>
        )}

        {invalidEpisodes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-red-600 mb-2">⚠️ Invalid Episodes Found:</p>
            <div className="space-y-1 text-xs font-mono bg-white p-3 rounded border border-red-200">
              {invalidEpisodes.slice(0, 3).map(ep => (
                <div key={ep.id} className="text-red-600">
                  {ep.id.slice(0, 8)}... | Date: {String(ep.datetime)} | Raw: {ep.date}
                </div>
              ))}
            </div>
            <p className="text-sm text-red-600 mt-2">
              These episodes have invalid dates and won't show in charts. Try editing them.
            </p>
          </div>
        )}

        {episodes.length === 0 && (
          <div className="text-center py-4">
            <Badge variant="outline">No episodes found</Badge>
            <p className="text-sm text-muted-foreground mt-2">Log some episodes to see data!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
