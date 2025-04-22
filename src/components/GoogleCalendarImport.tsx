
import { useState } from 'react';
import { CalendarPlus, AlertCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadICS } from '@/utils/calendarUtils';
import { CSVRow } from '@/types/csv';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { hasAnyConflicts, isWeekend, isPublicHoliday, isDateBefore } from '@/utils/dateUtils';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleCalendarImportProps {
  data: CSVRow[];
  disabled?: boolean;
}

const GoogleCalendarImport = ({ data, disabled = false }: GoogleCalendarImportProps) => {
  const [calendarName, setCalendarName] = useState('Activity Calendar');
  const [open, setOpen] = useState(false);
  
  // Check for date conflicts, weekends, and holidays
  const hasConflicts = hasAnyConflicts(data);
  const hasWeekendOrHoliday = data.some(row => 
    isWeekend(row.prepDate) || isWeekend(row.goDate) || 
    isPublicHoliday(row.prepDate) || isPublicHoliday(row.goDate)
  );
  
  // Check for date sequence issues (PREP must be before GO)
  const hasDateSequenceIssue = data.some(row => 
    !isDateBefore(row.prepDate, row.goDate)
  );
  
  const handleImport = () => {
    if (!calendarName.trim()) {
      toast.error('Please enter a calendar name');
      return;
    }
    
    if (hasConflicts) {
      toast.error('Cannot import calendar with date conflicts');
      return;
    }
    
    if (hasDateSequenceIssue) {
      toast.error('Cannot import calendar with invalid date sequences');
      return;
    }
    
    try {
      downloadICS(data, calendarName);
      toast.success('Calendar file generated with 2-day reminders. Follow Google Calendar import instructions');
      setOpen(false);
    } catch (error) {
      console.error('Error generating calendar file:', error);
      toast.error('Failed to generate calendar file');
    }
  };
  
  const totalEvents = data.length * 2; // Each activity creates 2 events
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || data.length === 0}
          className="flex gap-2 items-center"
        >
          <CalendarPlus className="h-4 w-4" />
          Import to Google Calendar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Import to Google Calendar</h3>
          <p className="text-xs text-muted-foreground">
            Generate an ICS file to import into Google Calendar. Each activity will create 
            separate events for PREP and GO dates ({totalEvents} events total) with 2-day reminders.
          </p>
          
          <Alert className="bg-blue-50 border-blue-200">
            <Bell className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700">
              Each event includes a reminder 2 days before the scheduled date.
            </AlertDescription>
          </Alert>
          
          {hasConflicts && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Some dates have conflicts with other events. Please resolve all date conflicts before importing.
              </AlertDescription>
            </Alert>
          )}
          
          {hasDateSequenceIssue && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Some activities have PREP dates that are not before GO dates. Please fix these date sequences.
              </AlertDescription>
            </Alert>
          )}
          
          {!hasConflicts && !hasDateSequenceIssue && hasWeekendOrHoliday && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs text-amber-700">
                Some dates fall on weekends or holidays. You can proceed, but consider checking these dates.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <label htmlFor="calendar-name" className="text-sm font-medium">
              Calendar Name
            </label>
            <Input 
              id="calendar-name"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              placeholder="Enter calendar name"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleImport} 
              disabled={hasConflicts || hasDateSequenceIssue}
              className={(hasConflicts || hasDateSequenceIssue) ? "opacity-50 cursor-not-allowed" : ""}
            >
              Generate ICS File
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
            <p className="font-medium">After downloading:</p>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>Open <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-primary underline">Google Calendar</a></li>
              <li>Click the + next to "Other calendars"</li>
              <li>Select "Import"</li>
              <li>Upload the downloaded ICS file</li>
              <li>Select the destination calendar</li>
              <li>Click "Import"</li>
            </ol>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GoogleCalendarImport;
