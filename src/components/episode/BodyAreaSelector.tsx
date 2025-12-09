
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BodyArea, BodyAreaDetail } from "@/types";
import { useCallback } from "react";

interface BodyAreaSelectorProps {
  selectedAreas: BodyArea[];
  onChange: (areas: BodyArea[]) => void;
}

const bodyAreaOptions: BodyAreaDetail[] = [
  { area: "palms", label: "Palms" },
  { area: "soles", label: "Feet Soles" },
  { area: "face", label: "Face" },
  { area: "armpits", label: "Armpits" },
  { area: "head", label: "Scalp/Head" },
  { area: "back", label: "Back" },
  { area: "groin", label: "Groin" },
  { area: "entireBody", label: "Entire Body" },
  { area: "other", label: "Other" },
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
