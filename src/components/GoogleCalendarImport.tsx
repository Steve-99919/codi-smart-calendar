
import { useState } from 'react';
import { CalendarPlus, AlertCircle, Bell, Download } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GoogleCalendarImportProps {
  data: CSVRow[];
  disabled?: boolean;
}

const GoogleCalendarImport = ({ data, disabled = false }: GoogleCalendarImportProps) => {
  const [calendarName, setCalendarName] = useState('Activity Calendar');
  const [open, setOpen] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  
  const totalEvents = data.length * 2; // Each activity creates 2 events
  
  const handleButtonClick = () => {
    // Show subscription dialog instead of immediately opening the popover
    setShowSubscriptionDialog(true);
  };
  
  const handleSubscribe = () => {
    // Here you would implement actual subscription logic with Stripe
    toast.success('Subscription process would start here. For now, we\'ll simulate success');
    setShowSubscriptionDialog(false);
    setOpen(true);
  };

  const handleImport = () => {
    if (!calendarName.trim()) {
      toast.error('Please enter a calendar name');
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
    <>
      <Button 
        variant="outline" 
        disabled={disabled || data.length === 0}
        className="flex gap-2 items-center"
        onClick={handleButtonClick}
      >
        <Download className="h-4 w-4" />
        Download as Calendar File
      </Button>
      
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calendar Export Subscription</DialogTitle>
            <DialogDescription>
              Export your activities to a calendar file with our Premium subscription.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border p-4 mb-4 bg-blue-50">
              <h3 className="text-lg font-medium mb-2">Premium Calendar Features</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Export unlimited activities to ICS calendar file</li>
                <li>2-day reminders for all events</li>
                <li>Easily import to Google Calendar, Apple Calendar, or Outlook</li>
                <li>Get regular updates and new features first</li>
              </ul>
              <div className="mt-4 text-center">
                <span className="text-2xl font-bold">$89</span>
                <span className="text-sm font-medium"> AUD / month</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe}>
              Subscribe Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Popover open={open} onOpenChange={setOpen}>
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
    </>
  );
};

export default GoogleCalendarImport;
