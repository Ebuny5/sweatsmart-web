
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Calendar, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          className="flex items-center justify-start gap-2 h-auto py-4"
          onClick={() => navigate("/log-episode")}
        >
          <div className="bg-primary-foreground p-2 rounded-full">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="font-medium">Log New Episode</div>
            <div className="text-xs text-primary-foreground/80">Record details of a sweating episode</div>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center justify-start gap-2 h-auto py-4"
          onClick={() => navigate("/log-episode?now=true")}
        >
          <div className="bg-muted p-2 rounded-full">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="font-medium">Log Now</div>
            <div className="text-xs text-muted-foreground">Quick record of current episode</div>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center justify-start gap-2 h-auto py-4"
          onClick={() => navigate("/history")}
        >
          <div className="bg-muted p-2 rounded-full">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="font-medium">View History</div>
            <div className="text-xs text-muted-foreground">See all your logged episodes</div>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center justify-start gap-2 h-auto py-4"
          onClick={() => navigate("/insights")}
        >
          <div className="bg-muted p-2 rounded-full">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="font-medium">View Insights</div>
            <div className="text-xs text-muted-foreground">See patterns and recommendations</div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
