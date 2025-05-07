
import { useState, useEffect } from 'react';
import { format, parse, subDays } from 'date-fns';
import { CSVRow } from "../types/csv";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Check, X, Calendar as CalendarIcon } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  isValidDateFormat, 
  isWeekend, 
  isPublicHoliday, 
  getHolidayInfo, 
  findDateConflicts,
  getConflictingEvents,
  isDateBefore 
} from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

interface EditableCSVRowProps {
  row: CSVRow;
  index: number;
  onSave: (index: number, updatedRow: CSVRow) => void;
  onCancel: () => void;
  data: CSVRow[];
}

const EditableCSVRow = ({ row, index, onSave, onCancel, data }: EditableCSVRowProps) => {
  const [editedRow, setEditedRow] = useState<CSVRow>({ ...row });
  const [dateErrors, setDateErrors] = useState({
    prepDate: false,
    goDate: false
  });
  const [showDatePreferenceDialog, setShowDatePreferenceDialog] = useState<boolean>(false);
  const [selectedGoDate, setSelectedGoDate] = useState<Date | null>(null);
  const [allowWeekends, setAllowWeekends] = useState<boolean>(false);
  const [allowHolidays, setAllowHolidays] = useState<boolean>(false);

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

  // Helper function to convert dd/mm/yyyy to Date
  const parseDate = (dateStr: string): Date | undefined => {
    if (!isValidDateFormat(dateStr)) return undefined;
    return parse(dateStr, 'dd/MM/yyyy', new Date());
  };

  // Helper function to convert Date to dd/mm/yyyy
  const formatDateString = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };
  
  // Handle go date selection from calendar
  const handleGoDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Check for weekend/holiday first
    const formattedDate = formatDateString(date);
    const isDateOnWeekend = isWeekend(formattedDate);
    const isDateOnHoliday = isPublicHoliday(formattedDate);
    
    // If it's a weekend or holiday, show the preference dialog
    if (isDateOnWeekend || isDateOnHoliday) {
      setSelectedGoDate(date);
      setShowDatePreferenceDialog(true);
      return;
    }
    
    // If it's not a weekend or holiday, just update the date
    applyDateSelection(date);
  };
  
  // Apply the date selection and calculate prep date
  const applyDateSelection = (goDate: Date) => {
    // Set the go date
    const formattedGoDate = formatDateString(goDate);
    
    // Calculate prep date (3 days before go date)
    const prepDate = subDays(goDate, 3);
    
    // Check if prep date is on a weekend or holiday
    const formattedPrepDate = formatDateString(prepDate);
    const isPrepOnWeekend = isWeekend(formattedPrepDate);
    const isPrepOnHoliday = isPublicHoliday(formattedPrepDate);
    
    // Final date validation
    if ((isPrepOnWeekend && !allowWeekends) || (isPrepOnHoliday && !allowHolidays)) {
      toast.error("The calculated prep date would fall on a weekend or holiday. Please adjust your preferences or choose a different go date.");
      return;
    }
    
    // Update dates
    setEditedRow(prev => ({
      ...prev,
      goDate: formattedGoDate,
      prepDate: formattedPrepDate
    }));
    
    setDateErrors(prev => ({
      ...prev,
      goDate: false,
      prepDate: false
    }));
  };
  
  // Handle confirming date preferences
  const handleConfirmDatePreferences = () => {
    if (selectedGoDate) {
      setShowDatePreferenceDialog(false);
      applyDateSelection(selectedGoDate);
      setSelectedGoDate(null);
    }
  };

  // Handle canceling date preferences
  const handleCancelDatePreferences = () => {
    setShowDatePreferenceDialog(false);
    setSelectedGoDate(null);
    // Reset preferences to defaults
    setAllowWeekends(false);
    setAllowHolidays(false);
  };
  
  const handleSave = () => {
    if (dateErrors.prepDate || dateErrors.goDate) {
      return;
    }
    
    // Check if dates have been modified
    if (editedRow.prepDate !== row.prepDate || editedRow.goDate !== row.goDate) {
      // Validate date sequence
      if (!isDateBefore(editedRow.prepDate, editedRow.goDate)) {
        toast.error('PREP date must be earlier than GO date');
        return;
      }
      
      // Check for date conflicts excluding the current row
      const hasConflict = findDateConflicts(
        data.filter((_, i) => i !== index), 
        editedRow.prepDate,
        -1
      ) || findDateConflicts(
        data.filter((_, i) => i !== index), 
        editedRow.goDate,
        -1
      );
      
      if (hasConflict) {
        const prepConflicts = getConflictingEvents(data, editedRow.prepDate, index);
        const goConflicts = getConflictingEvents(data, editedRow.goDate, index);
        const conflictingActivities = [...new Set([...prepConflicts, ...goConflicts])];
        
        toast.error(
          `Date conflict with: ${conflictingActivities.join(', ')}`
        );
        return;
      }
    }
    
    onSave(index, editedRow);
  };

  // Helper function to get date issue information
  const getDateIssue = (date: string) => {
    if (!isValidDateFormat(date)) return { hasIssue: false, message: '' };
    
    const isDateWeekend = isWeekend(date);
    const holidayInfo = getHolidayInfo(date);
    const hasConflict = findDateConflicts(data, date, index);
    const conflictingEvents = hasConflict ? getConflictingEvents(data, date, index) : [];
    
    const issues = [];
    
    if (isDateWeekend && holidayInfo.isHoliday) {
      issues.push(`Weekend & ${holidayInfo.name} (${holidayInfo.states?.join(", ")})`);
    } else if (isDateWeekend) {
      issues.push('Weekend');
    } else if (holidayInfo.isHoliday) {
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
  
  // Check date sequence issue (PREP should be before GO)
  const hasDateSequenceIssue = 
    isValidDateFormat(editedRow.prepDate) && 
    isValidDateFormat(editedRow.goDate) && 
    !isDateBefore(editedRow.prepDate, editedRow.goDate);
  
  // Get date issue information
  const prepDateIssue = getDateIssue(editedRow.prepDate);
  const goDateIssue = getDateIssue(editedRow.goDate);
  
  // Check if there are conflicts
  const hasPrepConflict = findDateConflicts(data, editedRow.prepDate, index);
  const hasGoConflict = findDateConflicts(data, editedRow.goDate, index);
  
  return (
    <>
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
          <div className="flex flex-col">
            <div className={cn(
              "flex items-center space-x-2 h-8 px-3 py-2 rounded-md border bg-gray-100",
              dateErrors.prepDate ? 'border-red-500' : 
              prepDateIssue.hasIssue ? 'bg-red-100' : '',
              hasPrepConflict ? 'border-2 border-red-500' : '',
              hasDateSequenceIssue ? 'border-2 border-amber-500' : ''
            )}>
              <span className="text-sm">{editedRow.prepDate || "Auto-calculated"}</span>
            </div>
            
            {prepDateIssue.hasIssue && !dateErrors.prepDate && (
              <span className="text-xs text-red-500 mt-1">
                {prepDateIssue.message}
              </span>
            )}
            
            {hasDateSequenceIssue && !dateErrors.prepDate && !dateErrors.goDate && (
              <span className="text-xs text-amber-500 mt-1">
                PREP date must be earlier than GO date
              </span>
            )}
          </div>
        </td>
        <td className="p-2">
          <div className="flex flex-col">
            <Popover>
              <PopoverTrigger asChild>
                <div className={cn(
                  "flex items-center space-x-2 h-8 px-3 py-2 rounded-md border",
                  dateErrors.goDate ? 'border-red-500' : 
                  goDateIssue.hasIssue ? 'bg-red-100' : '',
                  hasGoConflict ? 'border-2 border-red-500' : '',
                  hasDateSequenceIssue ? 'border-2 border-amber-500' : '',
                  "cursor-pointer"
                )}>
                  <span className="text-sm">{editedRow.goDate || "Select GO date"}</span>
                  <CalendarIcon className="h-4 w-4" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-auto" align="start">
                <Calendar
                  mode="single"
                  selected={parseDate(editedRow.goDate)}
                  onSelect={handleGoDateSelect}
                  className="rounded-md border pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            {goDateIssue.hasIssue && !dateErrors.goDate && (
              <span className="text-xs text-red-500 mt-1">
                {goDateIssue.message}
              </span>
            )}
          </div>
        </td>
        <td className="p-2 flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSave} 
            disabled={dateErrors.prepDate || dateErrors.goDate || hasDateSequenceIssue}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </td>
      </tr>

      {/* Date Preference Dialog */}
      <Dialog open={showDatePreferenceDialog} onOpenChange={setShowDatePreferenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weekend/Holiday Date Selected</DialogTitle>
            <DialogDescription>
              The date you selected falls on a weekend or public holiday. 
              Would you like to allow this?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowWeekends"
                checked={allowWeekends}
                onChange={(e) => setAllowWeekends(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="allowWeekends">Allow posting on weekends</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowHolidays"
                checked={allowHolidays}
                onChange={(e) => setAllowHolidays(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="allowHolidays">Allow posting on public holidays</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDatePreferences}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDatePreferences}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditableCSVRow;
