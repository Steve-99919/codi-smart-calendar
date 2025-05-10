
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CSVRow } from "@/types/csv";
import { format } from "date-fns";

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityIdPrefix: string;
  selectedPrepDate?: Date;
  selectedGoDate?: Date;
  newActivity: CSVRow;
  handlePrefixChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePrepDateSelect: (date: Date | undefined) => void;
  handleGoDateSelect: (date: Date | undefined) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  autoPrepDate: boolean;
  data: CSVRow[];
}

export const ActivityFormDialog = ({
  open,
  onOpenChange,
  activityIdPrefix,
  selectedPrepDate,
  selectedGoDate,
  newActivity,
  handlePrefixChange,
  handlePrepDateSelect,
  handleGoDateSelect,
  handleInputChange,
  handleSubmit,
  autoPrepDate,
  data
}: ActivityFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Label htmlFor="activityName">Activity Name*</Label>
              <Input
                id="activityName"
                name="activityName"
                value={newActivity.activityName}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the full activity name. This will be used to generate the activity ID.
              </p>
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
              <p className="text-xs text-muted-foreground">
                This date will be used as part of the activity ID.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activityId">Generated Activity ID</Label>
              <Input
                id="activityId"
                value={newActivity.activityId}
                readOnly
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">
                ID format: [Name Initials]-[Month][Day]-[Year]
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Prep Date* <span className="text-xs text-muted-foreground">(Auto-calculated)</span></Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={selectedPrepDate ? format(selectedPrepDate, "dd/MM/yyyy") : ""}
                  disabled
                  className="bg-gray-100"
                  placeholder="Automatically set 3 days before Go Date"
                />
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Prep date is automatically set 3 days before the Go date.
                {!newActivity.prepDate && selectedGoDate ? (
                  <span className="text-orange-500"> Warning: Selected Go date would result in a weekend or holiday prep date.</span>
                ) : ""}
              </p>
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
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Activity</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
