
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from 'date-fns';
import { ActivityWithStatus } from '@/types/event';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  activities: ActivityWithStatus[];
  onClose: () => void;
}

const CalendarView = ({ activities, onClose }: CalendarViewProps) => {
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

  // Check if a date has any activities
  const hasActivitiesOnDate = (date: Date): boolean => {
    return activities.some(activity => {
      const prepDate = new Date(activity.prep_date);
      const goDate = new Date(activity.go_date);
      return isSameDay(prepDate, date) || isSameDay(goDate, date);
    });
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date: Date): ActivityWithStatus[] => {
    return activities.filter(activity => {
      const prepDate = new Date(activity.prep_date);
      const goDate = new Date(activity.go_date);
      return isSameDay(prepDate, date) || isSameDay(goDate, date);
    });
  };

  // Get activities for the current view (today or this week)
  const getActivitiesForCurrentView = (): ActivityWithStatus[] => {
    if (viewMode === 'today') {
      return getActivitiesForDate(today);
    } else {
      return activities.filter(activity => {
        const prepDate = new Date(activity.prep_date);
        const goDate = new Date(activity.go_date);
        
        return (
          isWithinInterval(prepDate, { start: startOfCurrentWeek, end: endOfCurrentWeek }) ||
          isWithinInterval(goDate, { start: startOfCurrentWeek, end: endOfCurrentWeek })
        );
      });
    }
  };

  // Get selected date activities
  const selectedDateActivities = selectedDate 
    ? getActivitiesForDate(selectedDate) 
    : [];

  const currentViewActivities = getActivitiesForCurrentView();
  const weekRangeText = `${format(startOfCurrentWeek, 'MMM dd')} - ${format(endOfCurrentWeek, 'MMM dd')}`;

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Activities Calendar</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'today' ? 'default' : 'outline'}
            onClick={() => setViewMode('today')}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => setViewMode('week')}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            This Week ({weekRangeText})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            className="rounded-md border shadow"
            modifiers={{
              highlighted: date => hasActivitiesOnDate(date)
            }}
            modifiersStyles={{
              highlighted: { 
                backgroundColor: '#f0f9ff',
                fontWeight: 'bold',
                borderRadius: '50%'
              }
            }}
            onSelect={(date) => {
              if (date && hasActivitiesOnDate(date)) {
                setSelectedDate(date);
              }
            }}
          />
        </div>

        <div className="md:col-span-1 p-4 border rounded-md overflow-auto max-h-[400px]">
          {selectedDate ? (
            <>
              <h3 className="font-medium mb-2">
                Activities for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <ul className="divide-y">
                {selectedDateActivities.map((activity) => {
                  const prepDate = new Date(activity.prep_date);
                  const goDate = new Date(activity.go_date);
                  const isPrepDate = isSameDay(prepDate, selectedDate);
                  const isGoDate = isSameDay(goDate, selectedDate);
                  
                  return (
                    <li key={activity.id} className="py-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          activity.status?.status === 'completed' ? 'bg-green-500' :
                          activity.status?.status === 'delayed' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">{activity.activity_name}</p>
                          <div className="flex flex-col text-sm">
                            {isPrepDate && (
                              <span className="text-orange-600 font-medium">
                                PREP: {format(prepDate, 'MMM dd, yyyy')}
                              </span>
                            )}
                            {isGoDate && (
                              <span className="text-green-600 font-medium">
                                GO: {format(goDate, 'MMM dd, yyyy')}
                              </span>
                            )}
                            <span className="text-gray-600">
                              Status: {activity.status?.status || 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Select a date with activities to view details</p>
            </div>
          )}
          
          {selectedDate && selectedDateActivities.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No activities for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
