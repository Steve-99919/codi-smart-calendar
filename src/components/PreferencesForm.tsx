
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface Preferences {
  excludeWeekends: boolean;
  excludePublicHolidays: boolean;
  blockedDates: Date[];
  blockedMonths: number[]; // We'll keep this in the interface for compatibility
}

interface PreferencesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (preferences: Preferences) => void;
}

const PreferencesForm = ({ isOpen, onClose, onSubmit }: PreferencesFormProps) => {
  const [preferences, setPreferences] = useState<Preferences>({
    excludeWeekends: true,
    excludePublicHolidays: true,
    blockedDates: [],
    blockedMonths: [],
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = () => {
    toast.success('Preferences saved successfully');
    onSubmit(preferences);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Set Your Preferences</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="exclude-weekends">Exclude Weekends</Label>
              <p className="text-sm text-muted-foreground">
                Don't schedule activities on weekends
              </p>
            </div>
            <Switch
              id="exclude-weekends"
              checked={preferences.excludeWeekends}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, excludeWeekends: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="exclude-holidays">Exclude Public Holidays</Label>
              <p className="text-sm text-muted-foreground">
                Don't schedule activities on public holidays
              </p>
            </div>
            <Switch
              id="exclude-holidays"
              checked={preferences.excludePublicHolidays}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, excludePublicHolidays: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Blocked Dates</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select specific dates when you're unavailable
            </p>
            
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {preferences.blockedDates.length > 0 ? (
                    <span>
                      {preferences.blockedDates.length} date{preferences.blockedDates.length > 1 ? 's' : ''} selected
                    </span>
                  ) : (
                    <span>Select dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="multiple"
                  selected={preferences.blockedDates}
                  onSelect={(dates) => {
                    if (dates) {
                      setPreferences(prev => ({ ...prev, blockedDates: dates }));
                    }
                  }}
                  className={cn("p-3 pointer-events-auto")}
                />
                <div className="p-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => setDatePickerOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Apply Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreferencesForm;
