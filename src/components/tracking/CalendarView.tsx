
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ActivityWithStatus } from '@/types/event';
import { Badge } from '@/components/ui/badge';

interface CalendarViewProps {
  activities: ActivityWithStatus[];
  onClose: () => void;
}

const CalendarView = ({ activities, onClose }: CalendarViewProps) => {
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

  // Custom renderer for dates with activities
  const renderDay = (day: Date) => {
    const activitiesOnDay = getActivitiesForDate(day);
    
    if (activitiesOnDay.length === 0) {
      return <div className="w-full h-full">{day.getDate()}</div>;
    }

    return (
      <div className="w-full h-full relative">
        {day.getDate()}
        <div className="absolute bottom-0 right-0">
          <Badge variant="secondary" className="text-xs">
            {activitiesOnDay.length}
          </Badge>
        </div>
      </div>
    );
  };

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
              <div {...props}>
                {date ? renderDay(date) : null}
              </div>
            ),
          }}
          className="rounded-md border shadow p-3"
          selected={new Date()}
        />
      </div>
      <div className="mt-4 p-4 border rounded-md max-h-64 overflow-auto">
        <h3 className="font-medium mb-2">Activities Today</h3>
        <ul className="divide-y">
          {getActivitiesForDate(new Date()).map((activity) => (
            <li key={activity.id} className="py-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  activity.status?.status === 'completed' ? 'bg-green-500' :
                  activity.status?.status === 'delayed' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="font-medium">{activity.activity_name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(activity.prep_date).toLocaleDateString() === format(new Date(), 'MM/dd/yyyy') 
                      ? 'PREP Date' 
                      : 'GO Date'}
                  </p>
                </div>
              </div>
            </li>
          ))}
          {getActivitiesForDate(new Date()).length === 0 && (
            <li className="py-2 text-gray-500">No activities today</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CalendarView;
