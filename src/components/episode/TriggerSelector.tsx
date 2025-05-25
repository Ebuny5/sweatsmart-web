
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { Trigger } from "@/types";

interface TriggerSelectorProps {
  triggers: Trigger[];
  onTriggersChange: (triggers: Trigger[]) => void;
}

const TriggerSelector: React.FC<TriggerSelectorProps> = ({ 
  triggers = [], // Default to empty array to prevent undefined errors
  onTriggersChange 
}) => {
  const [customTrigger, setCustomTrigger] = useState("");
  const [activeTab, setActiveTab] = useState("environmental");

  const predefinedTriggers = {
    environmental: [
      "Hot Temperature",
      "High Humidity", 
      "Crowded Spaces",
      "Bright Lights",
      "Loud Noises"
    ],
    emotional: [
      "Stress/Anxiety",
      "Excitement", 
      "Nervousness",
      "Embarrassment",
      "Anger"
    ],
    dietary: [
      "Spicy Food",
      "Caffeine",
      "Alcohol", 
      "Hot Drinks",
      "Heavy Meals"
    ],
    activity: [
      "Physical Exercise",
      "Social Events",
      "Public Speaking", 
      "Work Tasks",
      "Certain Clothing"
    ]
  };

  const handleTriggerToggle = (triggerLabel: string, type: string) => {
    if (!Array.isArray(triggers)) return; // Safety check
    
    const existingIndex = triggers.findIndex(t => t.label === triggerLabel);
    
    if (existingIndex >= 0) {
      const newTriggers = triggers.filter((_, index) => index !== existingIndex);
      onTriggersChange(newTriggers);
    } else {
      const newTrigger: Trigger = {
        type: type as "environmental" | "emotional" | "dietary" | "activity",
        value: triggerLabel.toLowerCase().replace(/\s+/g, '_'),
        label: triggerLabel
      };
      onTriggersChange([...triggers, newTrigger]);
    }
  };

  const handleAddCustomTrigger = () => {
    if (customTrigger.trim()) {
      const newTrigger: Trigger = {
        type: activeTab as "environmental" | "emotional" | "dietary" | "activity",
        value: customTrigger.toLowerCase().replace(/\s+/g, '_'),
        label: customTrigger.trim()
      };
      onTriggersChange([...triggers, newTrigger]);
      setCustomTrigger("");
    }
  };

  const handleRemoveTrigger = (triggerToRemove: Trigger) => {
    if (!Array.isArray(triggers)) return; // Safety check
    const newTriggers = triggers.filter(t => t.label !== triggerToRemove.label);
    onTriggersChange(newTriggers);
  };

  const isTriggerSelected = (triggerLabel: string) => {
    if (!Array.isArray(triggers)) return false; // Safety check
    return triggers.some(t => t.label === triggerLabel);
  };

  const renderTriggerGrid = (triggerList: string[], type: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {triggerList.map((trigger) => (
        <div
          key={trigger}
          className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
            isTriggerSelected(trigger)
              ? "bg-primary/10 border-primary"
              : "bg-background border-border hover:bg-muted"
          }`}
          onClick={() => handleTriggerToggle(trigger, type)}
        >
          <Checkbox
            checked={isTriggerSelected(trigger)}
            className="pointer-events-none"
          />
          <span className="text-xs font-medium leading-tight break-words flex-1">
            {trigger}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Potential Triggers</CardTitle>
        <CardDescription>
          What might have caused or contributed to this episode?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="environmental" className="text-xs px-1">
              Environment
            </TabsTrigger>
            <TabsTrigger value="emotional" className="text-xs px-1">
              Emotional
            </TabsTrigger>
            <TabsTrigger value="dietary" className="text-xs px-1">
              Dietary
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs px-1">
              Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="environmental" className="space-y-4">
            {renderTriggerGrid(predefinedTriggers.environmental, "environmental")}
          </TabsContent>
          
          <TabsContent value="emotional" className="space-y-4">
            {renderTriggerGrid(predefinedTriggers.emotional, "emotional")}
          </TabsContent>
          
          <TabsContent value="dietary" className="space-y-4">
            {renderTriggerGrid(predefinedTriggers.dietary, "dietary")}
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            {renderTriggerGrid(predefinedTriggers.activity, "activity")}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Input
            placeholder="Add custom trigger..."
            value={customTrigger}
            onChange={(e) => setCustomTrigger(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTrigger()}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleAddCustomTrigger}
            size="sm"
            disabled={!customTrigger.trim()}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {Array.isArray(triggers) && triggers.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Selected Triggers:</h4>
            <div className="flex flex-wrap gap-2">
              {triggers.map((trigger, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="flex items-center gap-1 text-xs"
                >
                  <span className="capitalize">{trigger.type}</span>
                  <span>•</span>
                  <span>{trigger.label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                    onClick={() => handleRemoveTrigger(trigger)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TriggerSelector;
