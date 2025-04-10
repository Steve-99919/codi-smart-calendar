
import { useState } from 'react';
import { CSVRow } from "../types/csv";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableCSVRow from './EditableCSVRow';
import { isWeekend, isPublicHoliday, getHolidayInfo } from '@/utils/dateUtils';

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

  // Helper function to determine if a specific date is weekend or holiday and get the appropriate message
  const getDateIssue = (date: string) => {
    const isDateWeekend = isWeekend(date);
    const holidayInfo = getHolidayInfo(date);
    
    if (isDateWeekend && holidayInfo.isHoliday) {
      return { 
        hasIssue: true, 
        message: `Weekend & ${holidayInfo.name} (${holidayInfo.states?.join(", ")})` 
      };
    }
    
    if (isDateWeekend) {
      return { hasIssue: true, message: 'Weekend' };
    }
    
    if (holidayInfo.isHoliday) {
      return { 
        hasIssue: true, 
        message: `${holidayInfo.name} (${holidayInfo.states?.join(", ")})` 
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
                {/* Individual date cells with conditional highlighting */}
                <TableCell>
                  <div className="flex flex-col">
                    {(() => {
                      const prepDateIssue = getDateIssue(row.prepDate);
                      return (
                        <>
                          <span className={`${prepDateIssue.hasIssue ? 'bg-red-100 px-2 py-1 rounded' : ''}`}>
                            {row.prepDate}
                          </span>
                          {prepDateIssue.hasIssue && (
                            <span className="text-xs text-red-500 mt-1">{prepDateIssue.message}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {(() => {
                      const goDateIssue = getDateIssue(row.goDate);
                      return (
                        <>
                          <span className={`${goDateIssue.hasIssue ? 'bg-red-100 px-2 py-1 rounded' : ''}`}>
                            {row.goDate}
                          </span>
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
