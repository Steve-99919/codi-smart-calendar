import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CSVRow } from '@/types/csv';
import { 
  isWeekend, 
  isPublicHoliday, 
  isValidDateFormat, 
  findDateConflicts,
  getConflictingEvents
} from '@/utils/dateUtils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddActivityFormProps {
  data: CSVRow[];
  onAddActivity: (newActivity: CSVRow) => void;
}

const AddActivityForm = ({ data, onAddActivity }: AddActivityFormProps) => {
  const [showPreferenceDialog, setShowPreferenceDialog] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [allowWeekends, setAllowWeekends] = useState(false);
  const [allowHolidays, setAllowHolidays] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [selectedPrepDate, setSelectedPrepDate] = useState<Date>();
  const [selectedGoDate, setSelectedGoDate] = useState<Date>();
  const [activityIdPrefix, setActivityIdPrefix] = useState<string>('A');

  const parseActivityId = (id: string) => {
    const match = id.match(/([A-Za-z]+)(\d+)/);
    return match ? { prefix: match[1], number: parseInt(match[2]) } : null;
  };

  const getNextNumber = (prefix: string) => {
    const relevantIds = data
      .map(item => parseActivityId(item.activityId))
      .filter(parsed => parsed?.prefix === prefix);
    
    if (relevantIds.length === 0) return 1;
    
    const maxNumber = Math.max(...relevantIds.map(parsed => parsed?.number || 0));
    return maxNumber + 1;
  };

  useEffect(() => {
    if (showAddForm) {
      const nextNumber = getNextNumber(activityIdPrefix);
      setNewActivity(prev => ({
        ...prev,
        activityId: `${activityIdPrefix}${nextNumber}`
      }));
    }
  }, [showAddForm, activityIdPrefix, data]);

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrefix = e.target.value.replace(/[^A-Za-z]/g, '');
    setActivityIdPrefix(newPrefix);
    const nextNumber = getNextNumber(newPrefix);
    setNewActivity(prev => ({
      ...prev,
      activityId: `${newPrefix}${nextNumber}`
    }));
  };

  const handlePrepDateSelect = (date: Date | undefined) => {
    setSelectedPrepDate(date);
    if (date) {
      setNewActivity(prev => ({
        ...prev,
        prepDate: format(date, 'dd/MM/yyyy')
      }));
    }
  };

  const handleGoDateSelect = (date: Date | undefined) => {
    setSelectedGoDate(date);
    if (date) {
      setNewActivity(prev => ({
        ...prev,
        goDate: format(date, 'dd/MM/yyyy')
      }));
    }
  };

  const handleOpenAddActivity = () => {
    setShowPreferenceDialog(true);
  };

  const handleProceedToForm = () => {
    setShowPreferenceDialog(false);
    setShowAddForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name !== 'activityId') {
      setNewActivity({
        ...newActivity,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    if (!newActivity.activityId || !newActivity.activityName || 
        !newActivity.prepDate || !newActivity.goDate) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (!isValidDateFormat(newActivity.prepDate) || !isValidDateFormat(newActivity.goDate)) {
      toast.error("Please enter dates in dd/mm/yyyy format");
      return false;
    }

    if (!allowWeekends) {
      if (isWeekend(newActivity.prepDate)) {
        setConflictMessage(`Prep Date (${newActivity.prepDate}) falls on a weekend. Do you want to continue anyway?`);
        setShowConflictAlert(true);
        return false;
      }
      if (isWeekend(newActivity.goDate)) {
        setConflictMessage(`Go Date (${newActivity.goDate}) falls on a weekend. Do you want to continue anyway?`);
        setShowConflictAlert(true);
        return false;
      }
    }

    if (!allowHolidays) {
      if (isPublicHoliday(newActivity.prepDate)) {
        setConflictMessage(`Prep Date (${newActivity.prepDate}) falls on a public holiday. Do you want to continue anyway?`);
        setShowConflictAlert(true);
        return false;
      }
      if (isPublicHoliday(newActivity.goDate)) {
        setConflictMessage(`Go Date (${newActivity.goDate}) falls on a public holiday. Do you want to continue anyway?`);
        setShowConflictAlert(true);
        return false;
      }
    }

    const prepConflicts = getConflictingEvents(data, newActivity.prepDate, -1);
    if (prepConflicts.length > 0) {
      setConflictMessage(`Prep Date (${newActivity.prepDate}) conflicts with: ${prepConflicts.join(", ")}. Do you want to continue anyway?`);
      setShowConflictAlert(true);
      return false;
    }

    const goConflicts = getConflictingEvents(data, newActivity.goDate, -1);
    if (goConflicts.length > 0) {
      setConflictMessage(`Go Date (${newActivity.goDate}) conflicts with: ${goConflicts.join(", ")}. Do you want to continue anyway?`);
      setShowConflictAlert(true);
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAddActivity({
        ...newActivity,
        isWeekend: isWeekend(newActivity.prepDate) || isWeekend(newActivity.goDate),
        isHoliday: isPublicHoliday(newActivity.prepDate) || isPublicHoliday(newActivity.goDate)
      });
      resetForm();
    }
  };

  const handleContinueAnyway = () => {
    setShowConflictAlert(false);
    onAddActivity({
      ...newActivity,
      isWeekend: isWeekend(newActivity.prepDate) || isWeekend(newActivity.goDate),
      isHoliday: isPublicHoliday(newActivity.prepDate) || isPublicHoliday(newActivity.goDate)
    });
    resetForm();
  };

  const resetForm = () => {
    setNewActivity({
      activityId: "",
      activityName: "",
      description: "",
      strategy: "",
      prepDate: "",
      goDate: ""
    });
    setSelectedPrepDate(undefined);
    setSelectedGoDate(undefined);
    setShowAddForm(false);
  };

  return (
    <>
      <Button onClick={handleOpenAddActivity}>Add Activity</Button>

      <Dialog open={showPreferenceDialog} onOpenChange={setShowPreferenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Scheduling Preferences</DialogTitle>
            <DialogDescription>
              Please set your preferences for this activity.
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
            <Button variant="outline" onClick={() => setShowPreferenceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleProceedToForm}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
            <DialogDescription>
              Fill in the details for the new activity.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activityIdPrefix">Activity ID Prefix</Label>
                <Input
                  id="activityIdPrefix"
                  value={activityIdPrefix}
                  onChange={handlePrefixChange}
                  maxLength={5}
                  className="w-24"
                />
                <div className="text-sm text-gray-500">
                  Next ID will be: {activityIdPrefix}{getNextNumber(activityIdPrefix)}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="activityName">Activity Name*</Label>
                <Input
                  id="activityName"
                  name="activityName"
                  value={newActivity.activityName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={newActivity.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="strategy">Strategy</Label>
                <Input
                  id="strategy"
                  name="strategy"
                  value={newActivity.strategy}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Prep Date*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedPrepDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedPrepDate ? format(selectedPrepDate, "dd/MM/yyyy") : <span>Pick a prep date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedPrepDate}
                      onSelect={handlePrepDateSelect}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Go Date*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedGoDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedGoDate ? format(selectedGoDate, "dd/MM/yyyy") : <span>Pick a go date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedGoDate}
                      onSelect={handleGoDateSelect}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Activity</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConflictAlert} onOpenChange={setShowConflictAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Date Conflict Detected</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConflictAlert(false)}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueAnyway}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddActivityForm;
