import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface DaySelectorProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  label?: string;
  className?: string;
}

const dayAbbreviations = [
  { full: "Monday", short: "M" },
  { full: "Tuesday", short: "T" },
  { full: "Wednesday", short: "W" },
  { full: "Thursday", short: "T" },
  { full: "Friday", short: "F" },
  { full: "Saturday", short: "S" }
];

export function DaySelector({ selectedDays, onDaysChange, label = "Select Days", className = "" }: DaySelectorProps) {
  const [selectAll, setSelectAll] = useState(false);

  // Update selectAll state when selectedDays changes
  useEffect(() => {
    const allDays = dayAbbreviations.map(d => d.full);
    setSelectAll(selectedDays.length === allDays.length && allDays.every(day => selectedDays.includes(day)));
  }, [selectedDays]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allDays = dayAbbreviations.map(d => d.full);
      onDaysChange(allDays);
    } else {
      onDaysChange([]);
    }
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      onDaysChange([...selectedDays, day]);
    } else {
      onDaysChange(selectedDays.filter(d => d !== day));
    }
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      
      {/* Select All Checkbox */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          id="selectAll"
          className="h-4 w-4 text-[#079E74] rounded border-gray-300 focus:ring-[#079E74]"
          checked={selectAll}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
        <Label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
          Select All
        </Label>
      </div>

      {/* Individual Day Checkboxes */}
      <div className="flex flex-wrap gap-3">
        {dayAbbreviations.map(({ full, short }) => (
          <div key={full} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id={`day-${full}`}
              className="h-4 w-4 text-[#079E74] rounded border-gray-300 focus:ring-[#079E74]"
              checked={selectedDays.includes(full)}
              onChange={(e) => handleDayToggle(full, e.target.checked)}
            />
            <Label 
              htmlFor={`day-${full}`} 
              className="text-sm font-medium text-gray-600 cursor-pointer select-none min-w-[20px] text-center"
              title={full}
            >
              {short}
            </Label>
          </div>
        ))}
      </div>

      {/* Selected Days Summary */}
      {selectedDays.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Selected: {selectedDays.length === dayAbbreviations.length ? "All days" : selectedDays.join(", ")}
        </div>
      )}
    </div>
  );
}
