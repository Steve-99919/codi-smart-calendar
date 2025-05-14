
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ActivityWithStatus } from '@/types/event';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  activities: ActivityWithStatus[];
  onClose: () => void;
}

const CalendarView = ({ activities, onClose }: CalendarViewProps) => {
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

  // Group activities by date for display in calendar
  const dateHasActivities = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return activities.some(activity => {
      const prepDate = new Date(activity.prep_date);
      const goDate = new Date(activity.go_date);
      
      return (
        format(prepDate, 'yyyy-MM-dd') === dateStr ||
        format(goDate, 'yyyy-MM-dd') === dateStr
      );
    });
  };

  const getActivitiesForDate = (date: Date): ActivityWithStatus[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return activities.filter(activity => {
      const prepDate = new Date(activity.prep_date);
      const goDate = new Date(activity.go_date);
      
      return (
        format(prepDate, 'yyyy-MM-dd') === dateStr ||
        format(goDate, 'yyyy-MM-dd') === dateStr
      );
    });
  };

  // Get activities for the current view (today or this week)
  const getActivitiesForCurrentView = (): ActivityWithStatus[] => {
    if (viewMode === 'today') {
      return getActivitiesForDate(new Date());
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

  // Custom renderer for dates with activities
  const renderDay = (day: Date) => {
    const activitiesOnDay = getActivitiesForDate(day);
    
    if (activitiesOnDay.length === 0) {
      return <div className="w-full h-full p-1">{day.getDate()}</div>;
    }

    return (
      <div className="w-full h-full p-1 bg-blue-50 rounded-md">
        <div className="font-semibold">{day.getDate()}</div>
        <div className="overflow-y-auto max-h-20 text-xs">
          {activitiesOnDay.map((activity, index) => {
            const isPrepDate = format(new Date(activity.prep_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
            const isGoDate = format(new Date(activity.go_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
            
            return (
              <div 
                key={`${activity.id}-${index}`} 
                className={`mb-1 p-1 rounded ${
                  isPrepDate ? 'bg-blue-100' : isGoDate ? 'bg-green-100' : ''
                }`}
              >
                <div className="truncate">
                  {isPrepDate && <span className="text-blue-700 font-medium">PREP: </span>}
                  {isGoDate && <span className="text-green-700 font-medium">GO: </span>}
                  {activity.activity_name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
      
      <div className="mt-2">
        <Calendar
          mode="single"
          modifiers={{
            hasActivity: (date) => dateHasActivities(date),
          }}
          modifiersStyles={{
            hasActivity: { backgroundColor: '#f0f9ff', fontWeight: 'bold' },
          }}
          components={{
            Day: ({ date, ...props }) => (
              <div 
                {...props}
                className="h-32 w-full border border-gray-200"
              >
                {date ? renderDay(date) : null}
              </div>
            ),
          }}
          className="rounded-md border shadow p-3"
          selected={new Date()}
        />
      </div>
      
      <div className="mt-4 p-4 border rounded-md max-h-64 overflow-auto">
        <h3 className="font-medium mb-2">
          {viewMode === 'today' ? 'Activities Today' : `Activities This Week (${weekRangeText})`}
        </h3>
        <ul className="divide-y">
          {currentViewActivities.map((activity) => (
            <li key={activity.id} className="py-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  activity.status?.status === 'completed' ? 'bg-green-500' :
                  activity.status?.status === 'delayed' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="font-medium">{activity.activity_name}</p>
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-600">
                      PREP: {new Date(activity.prep_date).toLocaleDateString()}
                    </span>
                    <span className="text-gray-600">
                      GO: {new Date(activity.go_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {currentViewActivities.length === 0 && (
            <li className="py-2 text-gray-500">No activities {viewMode === 'today' ? 'today' : 'this week'}</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CalendarView;
