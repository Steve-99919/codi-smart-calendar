import { useState } from 'react';
import { format } from 'date-fns';
import { CSVRow } from "../types/csv";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableCSVRow from './EditableCSVRow';
import { toast } from "sonner";
import { useTableFilters } from '@/hooks/useTableFilters';
import TableFilters from './table/TableFilters';
import ActivityRow from './table/ActivityRow';
import { addDaysToDate } from '@/utils/dateUtils';
import { parseActivityId, reindexActivities } from '@/services/activityDataService';

interface CSVTableProps {
  data: CSVRow[];
  onUpdateData: (newData: CSVRow[]) => void;
}

const CSVTable = ({ data, onUpdateData }: CSVTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const {
    showWeekends,
    setShowWeekends,
    showHolidays,
    setShowHolidays,
    showDuplicates,
    setShowDuplicates,
    getRowHighlightClass
  } = useTableFilters();
  
  const handleRowClick = (index: number) => {
    setEditingIndex(index);
  };
  
  const handleDeleteActivity = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    
    reindexActivities(newData);
    
    onUpdateData(newData);
    toast.success('Activity deleted successfully');
  };

  const handleSaveRow = (index: number, updatedRow: CSVRow) => {
    import('@/services/activityDataService').then(({ updateActivity }) => {
      const newData = updateActivity(data, index, updatedRow);
      onUpdateData(newData);
      setEditingIndex(null);
    });
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };
  
  const handleDateSelect = (index: number, field: 'prepDate' | 'goDate', date: Date | undefined) => {
    if (!date) return;
    
    const formattedDate = format(date, 'dd/MM/yyyy');
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
      <TableFilters
        showWeekends={showWeekends}
        setShowWeekends={setShowWeekends}
        showHolidays={showHolidays}
        setShowHolidays={setShowHolidays}
        showDuplicates={showDuplicates}
        setShowDuplicates={setShowDuplicates}
      />

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
                <ActivityRow
                  key={`${row.activityId}-${index}`}
                  row={row}
                  index={index}
                  highlightClass={getRowHighlightClass(row, index, data)}
                  onRowClick={handleRowClick}
                  onMoveForward={handleMoveForward}
                  onDeleteActivity={handleDeleteActivity}
                  onDateSelect={handleDateSelect}
                />
              )
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CSVTable;
