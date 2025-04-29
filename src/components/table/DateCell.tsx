
import { format, parse } from 'date-fns';
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
  onDateSelect: (date: Date | undefined) => void;
}

const DateCell = ({ dateValue, onDateSelect }: DateCellProps) => {
  // Helper function to convert dd/mm/yyyy to Date
  const parseDate = (dateStr: string): Date | undefined => {
    if (!isValidDateFormat(dateStr)) return undefined;
    return parse(dateStr, 'dd/MM/yyyy', new Date());
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer">
          <span>{dateValue}</span>
          <CalendarIcon className="h-3 w-3" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" align="start">
        <Calendar
          mode="single"
          selected={parseDate(dateValue)}
          onSelect={onDateSelect}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateCell;
