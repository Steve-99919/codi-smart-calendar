
import { useState } from 'react';
import { CSVRow } from "../types/csv";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { isValidDateFormat } from '@/utils/dateUtils';

interface EditableCSVRowProps {
  row: CSVRow;
  index: number;
  onSave: (index: number, updatedRow: CSVRow) => void;
  onCancel: () => void;
}

const EditableCSVRow = ({ row, index, onSave, onCancel }: EditableCSVRowProps) => {
  const [editedRow, setEditedRow] = useState<CSVRow>({ ...row });
  const [dateErrors, setDateErrors] = useState({
    prepDate: false,
    goDate: false
  });
  
  const handleInputChange = (field: keyof CSVRow, value: string) => {
    setEditedRow(prev => ({ ...prev, [field]: value }));
    
    // Validate date fields
    if (field === 'prepDate' || field === 'goDate') {
      setDateErrors(prev => ({
        ...prev,
        [field]: !isValidDateFormat(value)
      }));
    }
  };
  
  const handleSave = () => {
    if (dateErrors.prepDate || dateErrors.goDate) {
      return;
    }
    onSave(index, editedRow);
  };
  
  return (
    <tr className="border-b border-gray-200">
      <td className="p-2">
        <Input 
          value={editedRow.activityId} 
          onChange={(e) => handleInputChange('activityId', e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2">
        <Input 
          value={editedRow.activityName} 
          onChange={(e) => handleInputChange('activityName', e.target.value)} 
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2">
        <Input 
          value={editedRow.description} 
          onChange={(e) => handleInputChange('description', e.target.value)} 
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2">
        <Input 
          value={editedRow.strategy} 
          onChange={(e) => handleInputChange('strategy', e.target.value)} 
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2">
        <Input 
          value={editedRow.prepDate} 
          onChange={(e) => handleInputChange('prepDate', e.target.value)} 
          className={`h-8 text-sm ${dateErrors.prepDate ? 'border-red-500' : ''}`}
          placeholder="dd/mm/yyyy"
        />
      </td>
      <td className="p-2">
        <Input 
          value={editedRow.goDate} 
          onChange={(e) => handleInputChange('goDate', e.target.value)} 
          className={`h-8 text-sm ${dateErrors.goDate ? 'border-red-500' : ''}`}
          placeholder="dd/mm/yyyy"
        />
      </td>
      <td className="p-2 flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleSave} disabled={dateErrors.prepDate || dateErrors.goDate}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

export default EditableCSVRow;
