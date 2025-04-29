
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface TableFiltersProps {
  showWeekends: boolean;
  setShowWeekends: (value: boolean) => void;
  showHolidays: boolean;
  setShowHolidays: (value: boolean) => void;
  showDuplicates: boolean;
  setShowDuplicates: (value: boolean) => void;
}

const TableFilters = ({
  showWeekends,
  setShowWeekends,
  showHolidays,
  setShowHolidays,
  showDuplicates,
  setShowDuplicates
}: TableFiltersProps) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="text-sm font-medium">Highlight:</span>
      <ToggleGroup type="multiple" variant="outline">
        <ToggleGroupItem
          value="weekends"
          aria-label="Toggle weekend highlights"
          onClick={() => setShowWeekends(!showWeekends)}
        >
          Weekends
        </ToggleGroupItem>
        <ToggleGroupItem
          value="holidays"
          aria-label="Toggle holiday highlights"
          onClick={() => setShowHolidays(!showHolidays)}
        >
          Holidays
        </ToggleGroupItem>
        <ToggleGroupItem
          value="duplicates"
          aria-label="Toggle duplicate date highlights"
          onClick={() => setShowDuplicates(!showDuplicates)}
        >
          Duplicate Dates
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default TableFilters;
