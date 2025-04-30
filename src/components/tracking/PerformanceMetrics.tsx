
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon, Check, Clock } from 'lucide-react';
import { ActivityWithStatus, EventStatus } from '@/types/event';

interface PerformanceMetricsProps {
  activities: ActivityWithStatus[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ activities }) => {
  // Calculate metrics
  const statusCounts: Record<EventStatus, number> = {
    upcoming: 0,
    completed: 0,
    delayed: 0
  };

  activities.forEach(activity => {
    if (activity.status) {
      // Get the status value
      let status = activity.status.status as EventStatus;
      
      // Map old status names to new ones if needed - using type assertions since we know the mapping is valid
      if (status === 'pending' as any) status = 'upcoming';
      if (status === 'done' as any) status = 'completed';
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    } else {
      statusCounts.upcoming += 1;
    }
  });

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
          count={statusCounts.upcoming} 
          icon={Clock} 
          color="text-orange-500"
          bgColor="bg-orange-100"
        />
        <MetricCard 
          title="Completed Activities" 
          count={statusCounts.completed} 
          icon={Check} 
          color="text-green-500"
          bgColor="bg-green-100"
        />
        <MetricCard 
          title="Delayed Activities" 
          count={statusCounts.delayed} 
          icon={ActivityIcon} 
          color="text-red-500"
          bgColor="bg-red-100"
        />
      </div>
    </div>
  );
};

export default PerformanceMetrics;
