
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PreferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowWeekends: boolean;
  setAllowWeekends: (allow: boolean) => void;
  allowHolidays: boolean;
  setAllowHolidays: (allow: boolean) => void;
  onProceed: () => void;
}

export const PreferenceDialog = ({
  open,
  onOpenChange,
  allowWeekends,
  setAllowWeekends,
  allowHolidays,
  setAllowHolidays,
  onProceed
}: PreferenceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={onProceed}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
