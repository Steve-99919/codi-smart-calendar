
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityWithStatus } from '@/types/event';
import { toast } from "sonner";

export const useActivities = (userId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityWithStatus[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<string, any>>({});
  const [initializingStatuses, setInitializingStatuses] = useState(false);

  const fetchActivities = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('prep_date', { ascending: true });
      if (activitiesError) throw activitiesError;

      const activityIds = (activitiesData || []).map((a) => a.id);
      let statusesData = [];
      if (activityIds.length > 0) {
        const { data: eventStatusesData, error: statusesError } = await supabase
          .from('event_statuses')
          .select('*')
          .in('activity_id', activityIds);
        if (statusesError) throw statusesError;
        statusesData = eventStatusesData || [];
      }

      const statusMap: Record<string, any> = {};
      statusesData.forEach((st) => {
        statusMap[st.activity_id] = st;
      });

      const activitiesWithStatus = (activitiesData || []).map(activity => ({
        ...activity,
        status: statusMap[activity.id] || null
      }));

      setActivities(activitiesWithStatus);
      setEventStatuses(statusMap);

      await initializeMissingStatuses(userId, activitiesData || [], statusMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load activities and statuses');
    } finally {
      setLoading(false);
    }
  };

  const initializeMissingStatuses = async (
    userId: string,
    activitiesData: any[],
    statusMap: Record<string, any>
  ) => {
    if (!activitiesData.length) return;

    setInitializingStatuses(true);
    try {
      const missingStatusRecords = activitiesData
        .filter(activity => !statusMap[activity.id])
        .map(activity => ({
          activity_id: activity.id,
          status: 'pending',
          status_updated_at: null,
          event_type: 'activity',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      if (missingStatusRecords.length === 0) {
        return;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('event_statuses')
        .insert(missingStatusRecords)
        .select();

      if (insertError) {
        console.error('Error inserting missing statuses:', insertError);
        toast.error('Failed to initialize some statuses');
        return;
      }

      const newStatusMap = { ...statusMap };
      insertedData?.forEach((st: any) => {
        newStatusMap[st.activity_id] = st;
      });

      setEventStatuses(newStatusMap);
      setActivities(prev => 
        prev.map(activity => ({
          ...activity,
          status: newStatusMap[activity.id] || null
        }))
      );
      
      toast.success(`Initialized ${insertedData.length} missing statuses as Pending`);
    } catch (error) {
      console.error('Unexpected error initializing missing statuses:', error);
      toast.error('Failed to initialize some statuses');
    } finally {
      setInitializingStatuses(false);
    }
  };

  const handleStatusChange = async (activityId: string, newStatus: string) => {
    const statusRecord = eventStatuses[activityId];
    if (!statusRecord) {
      toast.error('Status record not found');
      return;
    }

    if (statusRecord.status === newStatus) {
      return;
    }

    try {
      const { error } = await supabase
        .from('event_statuses')
        .update({ 
          status: newStatus, 
          status_updated_at: new Date().toISOString() 
        })
        .eq('id', statusRecord.id);

      if (error) throw error;

      const updatedStatusRecord = { 
        ...statusRecord, 
        status: newStatus, 
        status_updated_at: new Date().toISOString() 
      };
      
      setEventStatuses((prev) => ({
        ...prev,
        [activityId]: updatedStatusRecord,
      }));
      
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, status: updatedStatusRecord } 
            : activity
        )
      );

      toast.success(`Status updated successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  return {
    loading,
    activities,
    initializingStatuses,
    fetchActivities,
    handleStatusChange,
  };
};
