
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
  getNextNumber: (prefix: string) => number;
  handlePrefixChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePrepDateSelect: (date: Date | undefined) => void;
  handleGoDateSelect: (date: Date | undefined) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  autoPrepDate: boolean;
}

export const ActivityFormDialog = ({
  open,
  onOpenChange,
  activityIdPrefix,
  selectedPrepDate,
  selectedGoDate,
  newActivity,
  getNextNumber,
  handlePrefixChange,
  handlePrepDateSelect,
  handleGoDateSelect,
  handleInputChange,
  handleSubmit,
  autoPrepDate
}: ActivityFormDialogProps) => {
  // Calculate the next ID to display
  const nextId = `${activityIdPrefix}${getNextNumber(activityIdPrefix)}`;

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
              <Label htmlFor="activityIdPrefix">Activity ID Prefix</Label>
              <Input
                id="activityIdPrefix"
                value={activityIdPrefix}
                onChange={handlePrefixChange}
                maxLength={5}
                className="w-24"
              />
              <div className="text-sm text-gray-500">
                Next ID will be: {nextId}
              </div>
              
              <input 
                type="hidden" 
                name="activityId" 
                value={nextId} 
              />
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
            
            <div className="space-y-2">
              <Label>Prep Date* {autoPrepDate && <span className="text-xs text-muted-foreground">(Auto-calculated)</span>}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedPrepDate && "text-muted-foreground"
                    )}
                    disabled={autoPrepDate}
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
                    disabled={autoPrepDate}
                    className={cn("p-3 pointer-events-auto", autoPrepDate && "opacity-50 cursor-not-allowed")}
                  />
                </PopoverContent>
              </Popover>
              {autoPrepDate && (
                <p className="text-xs text-muted-foreground">Prep date is automatically set 3 days before the Go date.</p>
              )}
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
