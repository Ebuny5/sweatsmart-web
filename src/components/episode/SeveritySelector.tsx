
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { SeverityLevel } from "@/types";

interface SeveritySelectorProps {
  value: SeverityLevel;
  onChange: (value: SeverityLevel) => void;
}

const severityDescriptions = {
  1: "Mild - Slightly noticeable sweating",
  2: "Moderate - Noticeable sweating, minimal discomfort",
  3: "Medium - Visible sweating, moderate discomfort",
  4: "Severe - Heavy sweating, significant discomfort",
  5: "Extreme - Excessive sweating, severe discomfort or distress",
};

const SeveritySelector: React.FC<SeveritySelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <Label className="text-base">Severity Level</Label>
      
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
              value === level
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-input"
            }`}
            onClick={() => onChange(level as SeverityLevel)}
          >
            <span className="text-2xl font-bold">{level}</span>
          </button>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground">
        {severityDescriptions[value]}
      </p>
    </div>
  );
};

export default SeveritySelector;
