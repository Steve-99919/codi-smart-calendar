
import { useState, useEffect } from 'react';
import { format, parse, subDays } from 'date-fns';
import { CSVRow } from "../types/csv";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Check, X, Calendar as CalendarIcon, Settings } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { 
  isValidDateFormat, 
  isWeekend, 
  isPublicHoliday, 
  getHolidayInfo, 
  findDateConflicts,
  getConflictingEvents,
  isDateBefore,
  getValidPrepDate
} from '@/utils/dateUtils';
import { getPreviousBusinessDay } from '@/utils/businessDayUtils';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { ConflictAlertDialog } from './activity/ConflictAlertDialog';

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
  const [showPrepDatePreferenceDialog, setShowPrepDatePreferenceDialog] = useState<boolean>(false);
  const [showEditPreferenceDialog, setShowEditPreferenceDialog] = useState<boolean>(false);
  const [selectedGoDate, setSelectedGoDate] = useState<Date | null>(null);
  const [calculatedPrepDate, setCalculatedPrepDate] = useState<Date | null>(null);
  const [dialogSource, setDialogSource] = useState<'go' | 'prep'>('go');
  const [showConflictDialog, setShowConflictDialog] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string>('');
  const [allowWeekends, setAllowWeekends] = useState(false);
  const [allowHolidays, setAllowHolidays] = useState(false);

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

  // Handle opening preferences for editing
  const handleOpenEditPreferences = () => {
    setShowEditPreferenceDialog(true);
  };

  // Handle proceeding from edit preferences
  const handleProceedFromEditPreferences = () => {
    setShowEditPreferenceDialog(false);
    // Continue with normal editing flow
  };
  
  // Handle go date selection from calendar
  const handleGoDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Check for weekend/holiday first
    const formattedDate = formatDateString(date);
    const isDateOnWeekend = isWeekend(formattedDate);
    const isDateOnHoliday = isPublicHoliday(formattedDate);
    
    // Validate go date itself
    if (isDateOnWeekend && !allowWeekends) {
      toast.error("You have selected a weekend date for go date. Please enable weekend dates in preferences or select a different date.");
      return;
    }
    
    if (isDateOnHoliday && !allowHolidays) {
      toast.error("You have selected a public holiday for go date. Please enable holiday dates in preferences or select a different date.");
      return;
    }
    
    // Calculate initial prep date (3 days before go date)
    const initialPrepDate = subDays(date, 3);
    const initialPrepDateFormatted = formatDateString(initialPrepDate);
    
    // Check if the initial prep date needs adjustment
    const isPrepDateOnWeekend = isWeekend(initialPrepDateFormatted);
    const isPrepDateOnHoliday = isPublicHoliday(initialPrepDateFormatted);
    
    let finalPrepDate = initialPrepDate;
    let needsAdjustment = false;
    
    // If prep date falls on weekend/holiday and user doesn't allow them, adjust it
    if ((isPrepDateOnWeekend && !allowWeekends) || (isPrepDateOnHoliday && !allowHolidays)) {
      needsAdjustment = true;
      finalPrepDate = getPreviousBusinessDay(initialPrepDate, allowWeekends, allowHolidays);
    }
    
    const finalPrepDateFormatted = formatDateString(finalPrepDate);
    
    // Show info message if we had to adjust the prep date
    if (needsAdjustment) {
      const reasonMessage = isPrepDateOnWeekend && !allowWeekends ? 'weekend' : 'holiday';
      toast.info(`Prep date automatically adjusted from ${initialPrepDateFormatted} to ${finalPrepDateFormatted} to avoid ${reasonMessage}`);
    }
    
    // Update both dates
    setEditedRow(prev => ({
      ...prev,
      goDate: formattedDate,
      prepDate: finalPrepDateFormatted
    }));
    
    setDateErrors(prev => ({
      ...prev,
      goDate: false,
      prepDate: false
    }));
  };

  // Apply prep date preferences
  const applyPrepDatePreferences = () => {
    if (calculatedPrepDate) {
      // Use the calculated prep date as is
      const formattedPrepDate = formatDateString(calculatedPrepDate);
      setEditedRow(prev => ({
        ...prev,
        prepDate: formattedPrepDate
      }));
      
      setDateErrors(prev => ({
        ...prev,
        prepDate: false
      }));
    }
  };
  
  // Handle confirming date preferences
  const handleConfirmDatePreferences = () => {
    if (dialogSource === 'go' && selectedGoDate) {
      setShowDatePreferenceDialog(false);
      handleGoDateSelect(selectedGoDate);
      setSelectedGoDate(null);
    } else if (dialogSource === 'prep') {
      setShowPrepDatePreferenceDialog(false);
      applyPrepDatePreferences();
      setCalculatedPrepDate(null);
    }
  };

  // Handle canceling date preferences
  const handleCancelDatePreferences = () => {
    if (dialogSource === 'go') {
      setShowDatePreferenceDialog(false);
      setSelectedGoDate(null);
    } else {
      setShowPrepDatePreferenceDialog(false);
      setCalculatedPrepDate(null);
      
      // Revert to original dates if canceling prep date preferences
      setEditedRow(prev => ({
        ...prev,
        prepDate: row.prepDate,
        goDate: row.goDate
      }));
    }
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
      const hasPrepConflict = findDateConflicts(
        data.filter((_, i) => i !== index), 
        editedRow.prepDate,
        -1
      );
      
      const hasGoConflict = findDateConflicts(
        data.filter((_, i) => i !== index), 
        editedRow.goDate,
        -1
      );
      
      if (hasPrepConflict || hasGoConflict) {
        const prepConflicts = getConflictingEvents(data, editedRow.prepDate, index);
        const goConflicts = getConflictingEvents(data, editedRow.goDate, index);
        const conflictingActivities = [...new Set([...prepConflicts, ...goConflicts])];
        
        // Instead of preventing save, show a conflict dialog that allows the user to continue
        setConflictMessage(`Date conflict with: ${conflictingActivities.join(', ')}. Do you want to continue anyway?`);
        setShowConflictDialog(true);
        return;
      }
    }
    
    // If no conflicts or user confirmed despite conflicts, proceed with save
    proceedWithSave();
  };

  // New function to proceed with save after conflict resolution
  const proceedWithSave = () => {
    onSave(index, editedRow);
    toast.success("Activity updated successfully");
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
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <div className={cn(
                    "flex items-center space-x-2 h-8 px-3 py-2 rounded-md border flex-1",
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
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenEditPreferences}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
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

      {/* Edit Preferences Dialog */}
      <Dialog open={showEditPreferenceDialog} onOpenChange={setShowEditPreferenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Scheduling Preferences</DialogTitle>
            <DialogDescription>
              Please set your preferences for editing this activity.
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
              <Label htmlFor="allowWeekends">Allow posting on weekends for this activity</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowHolidays"
                checked={allowHolidays}
                onChange={(e) => setAllowHolidays(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="allowHolidays">Allow posting on public holidays for this activity</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditPreferenceDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleProceedFromEditPreferences}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Go Date Preference Dialog - Simplified without checkboxes */}
      <Dialog open={showDatePreferenceDialog} onOpenChange={setShowDatePreferenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weekend/Holiday Date Selected</DialogTitle>
            <DialogDescription>
              The date you selected falls on a weekend or public holiday. 
              Would you like to allow this?
            </DialogDescription>
          </DialogHeader>

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

      {/* Prep Date Preference Dialog - Simplified without checkboxes */}
      <Dialog open={showPrepDatePreferenceDialog} onOpenChange={setShowPrepDatePreferenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prep Date Falls on Weekend/Holiday</DialogTitle>
            <DialogDescription>
              The calculated prep date would fall on a weekend or public holiday.
              Would you like to allow this?
            </DialogDescription>
          </DialogHeader>

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

      {/* Conflict Alert Dialog - New component for handling conflicts */}
      <ConflictAlertDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        message={conflictMessage}
        onContinue={proceedWithSave}
      />
    </>
  );
};

export default EditableCSVRow;
