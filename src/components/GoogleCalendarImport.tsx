import { useState } from 'react';
import { Download } from 'lucide-react';
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

interface GoogleCalendarImportProps {
  data: CSVRow[];
  disabled?: boolean;
}

const GoogleCalendarImport = ({ data, disabled = false }: GoogleCalendarImportProps) => {
  const [calendarName, setCalendarName] = useState('Activity Calendar');
  const [open, setOpen] = useState(false);
  
  const totalEvents = data.length * 2; // Each activity creates 2 events

  const handleImport = () => {
    if (!calendarName.trim()) {
      toast.error('Please enter a calendar name');
      return;
    }
    
    if (data.length === 0) {
      toast.error('No activities to export');
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
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || data.length === 0}
          className="flex gap-2 items-center"
        >
          <Download className="h-4 w-4" />
          Download as Calendar File
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Download Calendar File</h3>
          <p className="text-xs text-muted-foreground">
            Generate an ICS file to import into Google Calendar. Each activity will create 
            separate events for PREP and GO dates ({totalEvents} events total) with 2-day reminders.
          </p>
          
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
