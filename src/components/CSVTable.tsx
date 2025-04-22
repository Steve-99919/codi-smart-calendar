
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
import { isValidDateFormat } from '@/utils/dateUtils';

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
    
    onUpdateData(newData);
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
