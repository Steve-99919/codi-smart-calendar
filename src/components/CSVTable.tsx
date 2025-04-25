import { useState } from 'react';
import { format, parse } from 'date-fns';
import { CSVRow } from "../types/csv";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableCSVRow from './EditableCSVRow';
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ArrowRightCircle, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { isValidDateFormat, isDateBefore, addDaysToDate, isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface CSVTableProps {
  data: CSVRow[];
  onUpdateData: (newData: CSVRow[]) => void;
}

const CSVTable = ({ data, onUpdateData }: CSVTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showWeekends, setShowWeekends] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  
  const handleRowClick = (index: number) => {
    setEditingIndex(index);
  };
  
  const handleDeleteActivity = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    
    newData.forEach((row, idx) => {
      row.activityId = (idx + 1).toString();
    });
    
    onUpdateData(newData);
    toast.success('Activity deleted successfully');
  };

  const isDuplicateDate = (date: string, currentIndex: number): boolean => {
    return data.some((row, index) => 
      index !== currentIndex && (row.prepDate === date || row.goDate === date)
    );
  };
  
  const getRowHighlightClass = (row: CSVRow, index: number): string => {
    if (showWeekends && (isWeekend(row.prepDate) || isWeekend(row.goDate))) {
      return "bg-red-50";
    }
    if (showHolidays && (isPublicHoliday(row.prepDate) || isPublicHoliday(row.goDate))) {
      return "bg-red-50";
    }
    if (showDuplicates && (
      isDuplicateDate(row.prepDate, index) || 
      isDuplicateDate(row.goDate, index)
    )) {
      return "bg-red-50";
    }
    return "";
  };
  
  const parseActivityId = (id: string) => {
    const match = id.match(/([A-Za-z]+)(\d+)/);
    return match ? { prefix: match[1], number: parseInt(match[2]) } : null;
  };

  const handleSaveRow = (index: number, updatedRow: CSVRow) => {
    const newData = [...data];
    newData.splice(index, 1);
    
    const insertIndex = newData.findIndex(
      item => !isDateBefore(item.prepDate, updatedRow.prepDate)
    );
    
    if (insertIndex >= 0) {
      newData.splice(insertIndex, 0, updatedRow);
      
      const prefixGroups = new Map<string, CSVRow[]>();
      
      newData.forEach(row => {
        const parsed = parseActivityId(row.activityId);
        if (parsed) {
          const { prefix } = parsed;
          if (!prefixGroups.has(prefix)) {
            prefixGroups.set(prefix, []);
          }
          prefixGroups.get(prefix)?.push(row);
        }
      });
      
      prefixGroups.forEach((rows, prefix) => {
        rows.forEach((row, idx) => {
          row.activityId = `${prefix}${idx + 1}`;
        });
      });
    } else {
      newData.push(updatedRow);
      const parsed = parseActivityId(updatedRow.activityId);
      if (parsed) {
        const samePrefix = newData.filter(row => {
          const p = parseActivityId(row.activityId);
          return p?.prefix === parsed.prefix;
        });
        updatedRow.activityId = `${parsed.prefix}${samePrefix.length}`;
      }
    }
    
    onUpdateData(newData);
    setEditingIndex(null);
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const parseDate = (dateStr: string): Date | undefined => {
    if (!isValidDateFormat(dateStr)) return undefined;
    return parse(dateStr, 'dd/MM/yyyy', new Date());
  };

  const formatDateString = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };
  
  const handleDateSelect = (index: number, field: 'prepDate' | 'goDate', date: Date | undefined) => {
    if (!date) return;
    
    const formattedDate = formatDateString(date);
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: formattedDate };
    
    onUpdateData(newData);
  };

  const handleMoveForward = (index: number) => {
    const newData = [...data];
    
    for (let i = index; i < newData.length; i++) {
      newData[i] = {
        ...newData[i],
        prepDate: addDaysToDate(newData[i].prepDate, 5),
        goDate: addDaysToDate(newData[i].goDate, 5)
      };
    }
    
    onUpdateData(newData);
    toast.success('Moved activities forward by 5 days');
  };

  return (
    <div className="space-y-4">
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

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity ID</TableHead>
              <TableHead>Activity Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>PREP Date</TableHead>
              <TableHead>GO Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              editingIndex === index ? (
                <EditableCSVRow 
                  key={`${row.activityId}-${index}-edit`}
                  row={row} 
                  index={index}
                  onSave={handleSaveRow}
                  onCancel={handleCancelEdit}
                  data={data}
                />
              ) : (
                <TableRow 
                  key={`${row.activityId}-${index}`}
                  className={`cursor-pointer hover:bg-gray-50 ${getRowHighlightClass(row, index)}`}
                >
                  <TableCell>{row.activityId}</TableCell>
                  <TableCell>{row.activityName}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{row.strategy}</TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer">
                          <span>{row.prepDate}</span>
                          <CalendarIcon className="h-3 w-3" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDate(row.prepDate)}
                          onSelect={(date) => handleDateSelect(index, 'prepDate', date)}
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer">
                          <span>{row.goDate}</span>
                          <CalendarIcon className="h-3 w-3" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDate(row.goDate)}
                          onSelect={(date) => handleDateSelect(index, 'goDate', date)}
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRowClick(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveForward(index)}
                        title="Move this and following activities forward by 1 week"
                      >
                        <ArrowRightCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteActivity(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CSVTable;
