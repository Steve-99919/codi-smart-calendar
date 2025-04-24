import { useState } from 'react';
import { format, parse } from 'date-fns';
import { CSVRow } from "../types/csv";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableCSVRow from './EditableCSVRow';
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ArrowRightCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { isValidDateFormat, isDateBefore, addDaysToDate } from '@/utils/dateUtils';
import { toast } from "sonner";

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
    newData.splice(index, 1);
    
    const insertIndex = newData.findIndex(
      item => !isDateBefore(item.prepDate, updatedRow.prepDate)
    );
    
    if (insertIndex >= 0) {
      newData.splice(insertIndex, 0, updatedRow);
      
      newData.forEach((row, idx) => {
        row.activityId = (idx + 1).toString();
      });
    } else {
      newData.push(updatedRow);
      updatedRow.activityId = newData.length.toString();
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
        prepDate: addDaysToDate(newData[i].prepDate, 7),
        goDate: addDaysToDate(newData[i].goDate, 7)
      };
    }
    
    onUpdateData(newData);
    toast.success('Moved activities forward by one week');
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
                  </div>
                </TableCell>
              </TableRow>
            )
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CSVTable;
