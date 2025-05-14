
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from 'date-fns';
import { ActivityWithStatus } from '@/types/event';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CircleDot } from 'lucide-react';

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

  // Function to count prep and go dates for a specific day
  const getDateActivityCounts = (date: Date) => {
    let prepCount = 0;
    let goCount = 0;
    
    activities.forEach(activity => {
      const prepDate = new Date(activity.prep_date);
      const goDate = new Date(activity.go_date);
      
      if (isSameDay(prepDate, date)) prepCount++;
      if (isSameDay(goDate, date)) goCount++;
    });
    
    return { prepCount, goCount };
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

  // Custom day component that shows dots for prep and go dates
  const renderDay = (day: Date) => {
    const { prepCount, goCount } = getDateActivityCounts(day);
    const hasActivities = prepCount > 0 || goCount > 0;
    
    return (
      <div 
        className={`w-full h-full p-2 rounded-md transition-colors cursor-pointer ${
          hasActivities ? 'hover:bg-gray-100' : ''
        } ${selectedDate && isSameDay(selectedDate, day) ? 'bg-blue-50' : ''}`}
        onClick={() => {
          if (hasActivities) {
            setSelectedDate(day);
          }
        }}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">{day.getDate()}</span>
          {hasActivities && (
            <div className="flex space-x-1">
              {prepCount > 0 && (
                <div className="flex items-center">
                  <CircleDot className="h-3 w-3 text-orange-500" />
                  {prepCount > 1 && (
                    <span className="text-xs text-orange-500 ml-0.5">{prepCount}</span>
                  )}
                </div>
              )}
              {goCount > 0 && (
                <div className="flex items-center">
                  <CircleDot className="h-3 w-3 text-green-500" />
                  {goCount > 1 && (
                    <span className="text-xs text-green-500 ml-0.5">{goCount}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get activities for selected date
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3">
          <div className="flex items-center mb-2 space-x-2">
            <div className="flex items-center">
              <CircleDot className="h-3 w-3 text-orange-500" />
              <span className="text-sm ml-1">Prep Date</span>
            </div>
            <div className="flex items-center">
              <CircleDot className="h-3 w-3 text-green-500" />
              <span className="text-sm ml-1">Go Date</span>
            </div>
          </div>
          
          <Calendar
            mode="single"
            components={{
              Day: ({ date, ...props }) => (
                <div 
                  {...props}
                  className="h-20 w-full border border-gray-200"
                >
                  {date ? renderDay(date) : null}
                </div>
              ),
            }}
            selected={selectedDate}
            className="rounded-md border shadow p-3"
            onSelect={(date) => {
              if (date) {
                const { prepCount, goCount } = getDateActivityCounts(date);
                if (prepCount > 0 || goCount > 0) {
                  setSelectedDate(date);
                }
              }
            }}
          />
        </div>

        <div className="md:col-span-2 p-4 border rounded-md overflow-auto">
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
