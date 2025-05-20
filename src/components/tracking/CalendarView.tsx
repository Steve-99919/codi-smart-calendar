
import React, { useState, useEffect } from 'react';
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
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [displayedActivities, setDisplayedActivities] = useState<ActivityWithStatus[]>([]);
  
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

  // Get activities for the current week
  const getActivitiesForCurrentWeek = (): ActivityWithStatus[] => {
    return activities.filter(activity => {
      const prepDate = new Date(activity.prep_date);
      const goDate = new Date(activity.go_date);
      
      return (
        isWithinInterval(prepDate, { start: startOfCurrentWeek, end: endOfCurrentWeek }) ||
        isWithinInterval(goDate, { start: startOfCurrentWeek, end: endOfCurrentWeek })
      );
    });
  };

  // Update displayed activities based on view mode and selected date
  useEffect(() => {
    if (viewMode === 'today') {
      setDisplayedActivities(getActivitiesForDate(today));
    } else if (viewMode === 'week') {
      setDisplayedActivities(getActivitiesForCurrentWeek());
    } else if (selectedDate) {
      setDisplayedActivities(getActivitiesForDate(selectedDate));
    }
  }, [viewMode, selectedDate, activities]);

  // Handle view mode changes
  const handleViewModeChange = (mode: 'today' | 'week') => {
    setViewMode(mode);
    if (mode === 'today') {
      setSelectedDate(today);
    } else {
      // For week view, we'll show all week activities but not highlight a specific date
      // Keep the selected date but update the displayed activities
      setSelectedDate(undefined);
    }
  };

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
            onClick={() => handleViewModeChange('today')}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => handleViewModeChange('week')}
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
              if (date) {
                setSelectedDate(date);
                setViewMode('custom'); // Now 'custom' is included in the type
              }
            }}
          />
        </div>

        <div className="md:col-span-1 p-4 border rounded-md overflow-auto max-h-[400px]">
          {displayedActivities.length > 0 ? (
            <>
              <h3 className="font-medium mb-2">
                {viewMode === 'today' 
                  ? `Activities for Today (${format(today, 'MMMM d, yyyy')})`
                  : viewMode === 'week'
                  ? `Activities for This Week (${weekRangeText})`
                  : selectedDate 
                  ? `Activities for ${format(selectedDate, 'MMMM d, yyyy')}`
                  : 'Activities'
                }
              </h3>
              <ul className="divide-y">
                {displayedActivities.map((activity) => {
                  const prepDate = new Date(activity.prep_date);
                  const goDate = new Date(activity.go_date);
                  
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
                            <span className="text-orange-600 font-medium">
                              PREP: {format(prepDate, 'MMM dd, yyyy')}
                            </span>
                            <span className="text-green-600 font-medium">
                              GO: {format(goDate, 'MMM dd, yyyy')}
                            </span>
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
            <div className="text-center py-4 text-gray-500">
              <p>No activities found for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
