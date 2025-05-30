
import { CSVRow } from "@/types/csv";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRightCircle, Trash2 } from "lucide-react";
import DateCell from "./DateCell";

interface ActivityRowProps {
  row: CSVRow;
  index: number;
  highlightClass: string;
  onRowClick: (index: number) => void;
  onMoveForward: (index: number) => void;
  onDeleteActivity: (index: number) => void;
  onDateSelect: (index: number, field: 'prepDate' | 'goDate', date: Date | undefined) => void;
}

const ActivityRow = ({ 
  row, 
  index, 
  highlightClass, 
  onRowClick, 
  onMoveForward,
  onDeleteActivity,
  onDateSelect
}: ActivityRowProps) => {
  return (
    <TableRow 
      className={`cursor-pointer hover:bg-gray-50 ${highlightClass}`}
    >
      <TableCell>{row.activityId}</TableCell>
      <TableCell>{row.activityName}</TableCell>
      <TableCell>{row.description}</TableCell>
      <TableCell>{row.strategy}</TableCell>
      <TableCell>
        <DateCell 
          dateValue={row.prepDate} 
          editable={false}
        />
      </TableCell>
      <TableCell>
        <DateCell 
          dateValue={row.goDate} 
          editable={false}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onRowClick(index)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveForward(index)}
            title="Move this and following activities forward by 5 days"
          >
            <ArrowRightCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteActivity(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ActivityRow;
