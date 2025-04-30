
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon, Check, Clock } from 'lucide-react';
import { ActivityWithStatus, EventStatus } from '@/types/event';

interface PerformanceMetricsProps {
  activities: ActivityWithStatus[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ activities }) => {
  // Calculate metrics
  // Include both new and legacy status types in the record
  const statusCounts: Record<string, number> = {
    upcoming: 0,
    completed: 0,
    delayed: 0,
    pending: 0, // legacy status
    done: 0     // legacy status
  };

  activities.forEach(activity => {
    if (activity.status) {
      // Get the status value as string to handle both old and new status values
      const statusValue = activity.status.status as string;
      
      // Map old status names to new ones
      let mappedStatus: string;
      if (statusValue === 'pending') {
        mappedStatus = 'upcoming';
        // Count both the legacy and mapped status
        statusCounts['pending'] = (statusCounts['pending'] || 0) + 1;
        statusCounts['upcoming'] = (statusCounts['upcoming'] || 0) + 1;
      } else if (statusValue === 'done') {
        mappedStatus = 'completed';
        // Count both the legacy and mapped status
        statusCounts['done'] = (statusCounts['done'] || 0) + 1;
        statusCounts['completed'] = (statusCounts['completed'] || 0) + 1;
      } else {
        mappedStatus = statusValue;
        // Count the standard status
        statusCounts[mappedStatus] = (statusCounts[mappedStatus] || 0) + 1;
      }
    } else {
      // Default to upcoming if no status
      statusCounts.upcoming += 1;
    }
  });

  // Display counts for the UI
  const displayCounts = {
    upcoming: statusCounts.upcoming + statusCounts.pending,
    completed: statusCounts.completed + statusCounts.done,
    delayed: statusCounts.delayed
  };

  const totalActivities = activities.length;
  
  const getCompletionPercentage = (count: number): number => {
    return totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0;
  };

  const MetricCard = ({ 
    title, 
    count, 
    icon: Icon, 
    color,
    bgColor
  }: { 
    title: string; 
    count: number; 
    icon: React.ElementType; 
    color: string;
    bgColor: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className={`${bgColor} p-2 rounded-full`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{count}</div>
          <div className="text-xs text-muted-foreground">
            {count > 0 && totalActivities > 0 && 
              `${getCompletionPercentage(count)}%`
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Upcoming Activities" 
          count={displayCounts.upcoming} 
          icon={Clock} 
          color="text-orange-500"
          bgColor="bg-orange-100"
        />
        <MetricCard 
          title="Completed Activities" 
          count={displayCounts.completed} 
          icon={Check} 
          color="text-green-500"
          bgColor="bg-green-100"
        />
        <MetricCard 
          title="Delayed Activities" 
          count={displayCounts.delayed} 
          icon={ActivityIcon} 
          color="text-red-500"
          bgColor="bg-red-100"
        />
      </div>
    </div>
  );
};

export default PerformanceMetrics;
