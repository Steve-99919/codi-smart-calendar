
import { useState } from 'react';
import { format, parse } from 'date-fns';
import { CSVRow } from "../types/csv";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableCSVRow from './EditableCSVRow';
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { 
  isWeekend, 
  isPublicHoliday, 
  getHolidayInfo, 
  findDateConflicts, 
  getConflictingEvents, 
  isValidDateFormat,
  isDateBefore 
} from '@/utils/dateUtils';

interface CSVTableProps {
  data: CSVRow[];
  onUpdateData: (newData: CSVRow[]) => void;
}

const CSVTable = ({ data, onUpdateData }: CSVTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const handleRowClick = (index: number) => {
    setEditingIndex(index);
  };
  
  const handleSaveRow = (index: number, updatedRow: CSVRow) => {
    const newData = [...data];
    
    // Check if the date values changed and update weekend/holiday flags
    if (updatedRow.prepDate !== data[index].prepDate || updatedRow.goDate !== data[index].goDate) {
      updatedRow.isWeekend = isWeekend(updatedRow.prepDate) || isWeekend(updatedRow.goDate);
      updatedRow.isHoliday = isPublicHoliday(updatedRow.prepDate) || isPublicHoliday(updatedRow.goDate);
    }
    
    newData[index] = updatedRow;
    onUpdateData(newData);
    setEditingIndex(null);
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  // Helper function to convert dd/mm/yyyy to Date
  const parseDate = (dateStr: string): Date | undefined => {
    if (!isValidDateFormat(dateStr)) return undefined;
    return parse(dateStr, 'dd/MM/yyyy', new Date());
  };

  // Helper function to convert Date to dd/mm/yyyy
  const formatDateString = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };
  
  // Handle date selection from calendar for non-edit mode
  const handleDateSelect = (index: number, field: 'prepDate' | 'goDate', date: Date | undefined) => {
    if (!date) return;
    
    const formattedDate = formatDateString(date);
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: formattedDate };
    
    // Update weekend/holiday flags
    newData[index].isWeekend = 
      isWeekend(newData[index].prepDate) || 
      isWeekend(newData[index].goDate);
    newData[index].isHoliday = 
      isPublicHoliday(newData[index].prepDate) || 
      isPublicHoliday(newData[index].goDate);
    
    onUpdateData(newData);
  };

  // Helper function to determine if a specific date is weekend or holiday and get the appropriate message
  const getDateIssue = (date: string, rowIndex: number) => {
    const isDateWeekend = isWeekend(date);
    const holidayInfo = getHolidayInfo(date);
    const hasConflict = findDateConflicts(data, date, rowIndex);
    const conflictingEvents = hasConflict ? getConflictingEvents(data, date, rowIndex) : [];
    
    const issues = [];
    
    if (isDateWeekend) {
      issues.push('Weekend');
    }
    
    if (holidayInfo.isHoliday) {
      issues.push(`${holidayInfo.name} (${holidayInfo.states?.join(", ")})`);
    }
    
    if (hasConflict) {
      issues.push(`Conflict with: ${conflictingEvents.join(', ')}`);
    }
    
    if (issues.length > 0) {
      return { 
        hasIssue: true, 
        message: issues.join(' & ')
      };
    }
    
    return { hasIssue: false, message: '' };
  };
  
  return (
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
            <TableHead></TableHead>
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
                onClick={() => handleRowClick(index)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <TableCell>{row.activityId}</TableCell>
                <TableCell>{row.activityName}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.strategy}</TableCell>
                {/* Individual date cells with conditional highlighting and calendar picker */}
                <TableCell>
                  <div className="flex flex-col">
                    {(() => {
                      const prepDateIssue = getDateIssue(row.prepDate, index);
                      const hasConflict = findDateConflicts(data, row.prepDate, index);
                      const hasSequenceIssue = 
                        isValidDateFormat(row.prepDate) && 
                        isValidDateFormat(row.goDate) && 
                        !isDateBefore(row.prepDate, row.goDate);
                      
                      return (
                        <>
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded cursor-pointer",
                                prepDateIssue.hasIssue ? 'bg-red-100' : '',
                                hasConflict ? 'border-2 border-red-500' : '',
                                hasSequenceIssue ? 'border-2 border-amber-500' : ''
                              )}>
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
                          
                          {prepDateIssue.hasIssue && (
                            <span className="text-xs text-red-500 mt-1">{prepDateIssue.message}</span>
                          )}
                          
                          {hasSequenceIssue && (
                            <span className="text-xs text-amber-500 mt-1">PREP date must be earlier than GO date</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {(() => {
                      const goDateIssue = getDateIssue(row.goDate, index);
                      const hasConflict = findDateConflicts(data, row.goDate, index);
                      const hasSequenceIssue = 
                        isValidDateFormat(row.prepDate) && 
                        isValidDateFormat(row.goDate) && 
                        !isDateBefore(row.prepDate, row.goDate);
                      
                      return (
                        <>
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded cursor-pointer",
                                goDateIssue.hasIssue ? 'bg-red-100' : '',
                                hasConflict ? 'border-2 border-red-500' : '',
                                hasSequenceIssue ? 'border-2 border-amber-500' : ''
                              )}>
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
                          
                          {goDateIssue.hasIssue && (
                            <span className="text-xs text-red-500 mt-1">{goDateIssue.message}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CSVTable;
