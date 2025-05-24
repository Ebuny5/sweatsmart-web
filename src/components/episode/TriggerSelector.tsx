
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trigger, TriggerType } from "@/types";

interface TriggerSelectorProps {
  selectedTriggers: Trigger[];
  onChange: (triggers: Trigger[]) => void;
}

// Clean, relevant trigger options without demo data
const triggerOptions: Trigger[] = [
  // Environmental triggers
  { type: "environmental", value: "hotTemperature", label: "Hot Temperature" },
  { type: "environmental", value: "coldTemperature", label: "Cold Temperature" },
  { type: "environmental", value: "highHumidity", label: "High Humidity" },
  { type: "environmental", value: "lowHumidity", label: "Low Humidity" },
  { type: "environmental", value: "sunny", label: "Sunny Weather" },
  { type: "environmental", value: "rainy", label: "Rainy Weather" },
  
  // Emotional triggers
  { type: "emotional", value: "stress", label: "Stress" },
  { type: "emotional", value: "anxiety", label: "Anxiety" },
  { type: "emotional", value: "excitement", label: "Excitement" },
  { type: "emotional", value: "anger", label: "Anger" },
  { type: "emotional", value: "embarrassment", label: "Embarrassment" },
  { type: "emotional", value: "nervousness", label: "Nervousness" },
  
  // Dietary triggers
  { type: "dietary", value: "spicyFood", label: "Spicy Food" },
  { type: "dietary", value: "caffeine", label: "Caffeine" },
  { type: "dietary", value: "alcohol", label: "Alcohol" },
  { type: "dietary", value: "sugar", label: "Sugar" },
  { type: "dietary", value: "dairyProducts", label: "Dairy Products" },
  
  // Activity triggers
  { type: "activity", value: "physicalExercise", label: "Physical Exercise" },
  { type: "activity", value: "socialEvents", label: "Social Events" },
  { type: "activity", value: "publicSpeaking", label: "Public Speaking" },
  { type: "activity", value: "workTasks", label: "Work Tasks" },
  { type: "activity", value: "certainClothing", label: "Certain Clothing" },
];

const TriggerSelector: React.FC<TriggerSelectorProps> = ({
  selectedTriggers,
  onChange,
}) => {
  const [customTrigger, setCustomTrigger] = useState<{
    type: TriggerType;
    value: string;
  } | null>(null);
  
  const handleToggle = (trigger: Trigger) => {
    const isSelected = selectedTriggers.some(
      (t) => t.type === trigger.type && t.value === trigger.value
    );
    
    if (isSelected) {
      onChange(
        selectedTriggers.filter(
          (t) => !(t.type === trigger.type && t.value === trigger.value)
        )
      );
    } else {
      onChange([...selectedTriggers, trigger]);
    }
  };
  
  const addCustomTrigger = (type: TriggerType, value: string) => {
    if (!value.trim()) return;
    
    const newTrigger: Trigger = {
      type,
      value: `custom-${type}-${value.toLowerCase().replace(/\s+/g, '-')}`,
      label: value.trim(),
    };
    
    onChange([...selectedTriggers, newTrigger]);
    setCustomTrigger(null);
  };
  
  const renderTriggerList = (type: TriggerType) => {
    const typeTriggers = triggerOptions.filter((t) => t.type === type);
    
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {typeTriggers.map((trigger) => {
            const isSelected = selectedTriggers.some(
              (t) => t.type === trigger.type && t.value === trigger.value
            );
            
            return (
              <div
                key={trigger.value}
                className={`flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 cursor-pointer ${
                  isSelected ? "border-primary bg-primary/10" : ""
                }`}
                onClick={() => handleToggle(trigger)}
              >
                <Checkbox
                  id={`trigger-${trigger.value}`}
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(trigger)}
                />
                <Label
                  htmlFor={`trigger-${trigger.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {trigger.label}
                </Label>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Input
            placeholder={`Add custom ${type} trigger...`}
            value={customTrigger?.type === type ? customTrigger.value : ""}
            onChange={(e) =>
              setCustomTrigger({ type, value: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && customTrigger) {
                e.preventDefault();
                addCustomTrigger(customTrigger.type, customTrigger.value);
              }
            }}
            className="flex-grow"
          />
          <button
            type="button"
            onClick={() => {
              if (customTrigger) {
                addCustomTrigger(customTrigger.type, customTrigger.value);
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            disabled={!customTrigger || customTrigger.type !== type || !customTrigger.value.trim()}
          >
            Add
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-3">
      <Label className="text-base">Potential Triggers</Label>
      
      <Tabs defaultValue="environmental">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="emotional">Emotional</TabsTrigger>
          <TabsTrigger value="dietary">Dietary</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="environmental">
          {renderTriggerList("environmental")}
        </TabsContent>
        
        <TabsContent value="emotional">
          {renderTriggerList("emotional")}
        </TabsContent>
        
        <TabsContent value="dietary">
          {renderTriggerList("dietary")}
        </TabsContent>
        
        <TabsContent value="activity">
          {renderTriggerList("activity")}
        </TabsContent>
      </Tabs>
      
      {selectedTriggers.length > 0 && (
        <div className="mt-4">
          <Label className="text-sm mb-2 block">Selected Triggers:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedTriggers.map((trigger) => (
              <div
                key={`${trigger.type}-${trigger.value}`}
                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center"
              >
                {trigger.label}
                <button
                  type="button"
                  onClick={() => handleToggle(trigger)}
                  className="ml-2 text-primary hover:text-primary/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TriggerSelector;
