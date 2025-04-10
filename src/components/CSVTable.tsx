
import { useState } from 'react';
import { CSVRow } from "../types/csv";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableCSVRow from './EditableCSVRow';
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';

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
                <TableCell className={`${row.isWeekend || row.isHoliday ? 'bg-red-100' : ''}`}>
                  {row.prepDate}
                </TableCell>
                <TableCell className={`${row.isWeekend || row.isHoliday ? 'bg-red-100' : ''}`}>
                  {row.goDate}
                </TableCell>
                <TableCell>
                  {(row.isWeekend || row.isHoliday) && (
                    <span className="text-xs text-red-500">
                      {row.isWeekend ? 'Weekend' : ''} 
                      {row.isWeekend && row.isHoliday ? ' & ' : ''}
                      {row.isHoliday ? 'Holiday' : ''}
                    </span>
                  )}
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
