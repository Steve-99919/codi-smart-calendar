
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
import { toast } from "sonner";

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
  
  // Form data
  const [newActivity, setNewActivity] = useState<CSVRow>({
    activityId: "",
    activityName: "",
    description: "",
    strategy: "",
    prepDate: "",
    goDate: ""
  });

  // Set next available ID when opening the form
  useEffect(() => {
    if (showAddForm) {
      // Find the highest ID and increment by 1 for default suggestion
      const highestId = Math.max(...data.map(item => 
        parseInt(item.activityId) || 0), 0);
      setNewActivity(prev => ({...prev, activityId: (highestId + 1).toString()}));
    }
  }, [showAddForm, data]);

  const handleOpenAddActivity = () => {
    setShowPreferenceDialog(true);
  };

  const handleProceedToForm = () => {
    setShowPreferenceDialog(false);
    setShowAddForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity({
      ...newActivity,
      [name]: value
    });
  };

  const validateForm = () => {
    // Basic validation
    if (!newActivity.activityId || !newActivity.activityName || 
        !newActivity.prepDate || !newActivity.goDate) {
      toast.error("Please fill in all required fields");
      return false;
    }

    // Validate date formats
    if (!isValidDateFormat(newActivity.prepDate) || !isValidDateFormat(newActivity.goDate)) {
      toast.error("Please enter dates in dd/mm/yyyy format");
      return false;
    }

    // Check for weekend conflicts
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

    // Check for holiday conflicts
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

    // Check for date conflicts with existing activities
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
    setShowAddForm(false);
  };

  return (
    <>
      <Button onClick={handleOpenAddActivity}>Add Activity</Button>

      {/* Preferences Dialog */}
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

      {/* Add Activity Form Dialog */}
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
                <Label htmlFor="activityId">Activity ID*</Label>
                <Input
                  id="activityId"
                  name="activityId"
                  value={newActivity.activityId}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-gray-500">Activities after this ID will be pushed forward</p>
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
                <Label htmlFor="prepDate">Prep Date* (dd/mm/yyyy)</Label>
                <Input
                  id="prepDate"
                  name="prepDate"
                  placeholder="dd/mm/yyyy"
                  value={newActivity.prepDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goDate">Go Date* (dd/mm/yyyy)</Label>
                <Input
                  id="goDate"
                  name="goDate"
                  placeholder="dd/mm/yyyy"
                  value={newActivity.goDate}
                  onChange={handleInputChange}
                  required
                />
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

      {/* Conflict Alert Dialog */}
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
