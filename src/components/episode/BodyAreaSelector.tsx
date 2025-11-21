
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BodyArea, BodyAreaDetail } from "@/types";
import { useCallback } from "react";

interface BodyAreaSelectorProps {
  selectedAreas: BodyArea[];
  onChange: (areas: BodyArea[]) => void;
}

const bodyAreaOptions: BodyAreaDetail[] = [
  { area: "palms", name: "palms", label: "Palms", icon: "hand" },
  { area: "soles", name: "soles", label: "Feet Soles", icon: "foot" },
  { area: "face", name: "face", label: "Face", icon: "smile" },
  { area: "underarms", name: "underarms", label: "Armpits", icon: "user" },
  { area: "scalp", name: "scalp", label: "Scalp/Head", icon: "brain" },
  { area: "back", name: "back", label: "Back", icon: "body" },
  { area: "groin", name: "groin", label: "Groin", icon: "user" },
  { area: "chest", name: "chest", label: "Chest", icon: "heart" },
];

const BodyAreaSelector: React.FC<BodyAreaSelectorProps> = ({
  selectedAreas,
  onChange,
}) => {
  const handleAreaToggle = useCallback((area: BodyArea) => {
    if (selectedAreas.includes(area)) {
      onChange(selectedAreas.filter((a) => a !== area));
    } else {
      onChange([...selectedAreas, area]);
    }
  }, [selectedAreas, onChange]);

  return (
    <div className="space-y-3">
      <Label className="text-base">Affected Body Areas</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {bodyAreaOptions.map((option) => (
          <div
            key={option.area}
            className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50"
          >
            <Checkbox
              id={`area-${option.area}`}
              checked={selectedAreas.includes(option.area)}
              onCheckedChange={() => handleAreaToggle(option.area)}
            />
            <Label
              htmlFor={`area-${option.area}`}
              className="text-sm font-normal cursor-pointer"
              onClick={() => handleAreaToggle(option.area)}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BodyAreaSelector;
