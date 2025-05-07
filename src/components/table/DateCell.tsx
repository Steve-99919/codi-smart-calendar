
import { format } from 'date-fns';
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { isValidDateFormat } from '@/utils/dateUtils';

interface DateCellProps {
  dateValue: string;
  onDateSelect?: (date: Date | undefined) => void;
  editable?: boolean;
}

const DateCell = ({ dateValue, onDateSelect, editable = false }: DateCellProps) => {
  // Helper function to convert dd/mm/yyyy to Date
  const parseDate = (dateStr: string): Date | undefined => {
    if (!isValidDateFormat(dateStr)) return undefined;
    return new Date(dateStr.split('/').reverse().join('-'));
  };

  // If not editable, just render the date value without the calendar icon or popover
  if (!editable || !onDateSelect) {
    return <div className="px-2 py-1">{dateValue}</div>;
  }

  // Otherwise, render the calendar popover for editing
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-100">
          <span>{dateValue}</span>
          <CalendarIcon className="h-3 w-3" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" align="start">
        <Calendar
          mode="single"
          selected={parseDate(dateValue)}
          onSelect={onDateSelect}
          className="rounded-md border pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateCell;
