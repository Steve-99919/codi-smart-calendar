
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityWithStatus, EventStatus } from '@/types/event';
import { toast } from "sonner";

export const useActivities = (userId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityWithStatus[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<string, any>>({});
  const [initializingStatuses, setInitializingStatuses] = useState(false);

  // Helper function to ensure status is of type EventStatus
  const ensureEventStatus = (status: string): EventStatus => {
    // Map legacy status names to new ones if needed
    if (status === 'pending') return 'upcoming';
    if (status === 'done') return 'completed';
    
    // Check if the status is already a valid EventStatus
    if (['upcoming', 'completed', 'delayed'].includes(status)) {
      return status as EventStatus;
    }
    
    // Default to 'upcoming' if not valid
    console.warn(`Unknown status value: ${status}, defaulting to 'upcoming'`);
    return 'upcoming';
  };

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

      // Create a map of activity ID to status record
      const statusMap: Record<string, any> = {};
      statusesData.forEach((st) => {
        // Ensure the status is of type EventStatus
        const status = ensureEventStatus(st.status);
        const eventType = ensureEventStatus(st.event_type);
        
        // Store the status record with properly typed status field
        statusMap[st.activity_id] = {
          ...st,
          status,
          event_type: eventType
        };
      });

      // Add status to each activity
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

    // Find activities without status records
    const missingStatusActivities = activitiesData.filter(activity => !statusMap[activity.id]);
    
    if (missingStatusActivities.length === 0) {
      return;
    }
    
    setInitializingStatuses(true);
    
    // Process each activity individually to avoid bulk insert issues
    try {
      for (const activity of missingStatusActivities) {
        const defaultStatus: EventStatus = 'upcoming';
        
        const { data, error } = await supabase
          .from('event_statuses')
          .insert({
            activity_id: activity.id,
            status: defaultStatus,
            event_type: defaultStatus, // Use the same value for both fields
            status_updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .single();

        if (error) {
          console.error(`Error initializing status for activity ${activity.id}:`, error);
          continue;
        }

        // Update local state with the new status
        if (data) {
          // Ensure the status is properly typed
          const typedStatus = {
            ...data,
            status: ensureEventStatus(data.status),
            event_type: ensureEventStatus(data.event_type)
          };
          
          setEventStatuses(prev => ({
            ...prev,
            [activity.id]: typedStatus
          }));
          
          // Update the activity with the new status
          setActivities(prev => {
            return prev.map(act => 
              act.id === activity.id 
                ? { ...act, status: typedStatus } 
                : act
            );
          });
        }
      }
      
      const successCount = missingStatusActivities.length;
      if (successCount > 0) {
        toast.success(`Initialized ${successCount} missing statuses as Upcoming`);
      }
    } catch (error) {
      console.error('Unexpected error initializing missing statuses:', error);
      toast.error('Failed to initialize some statuses');
    } finally {
      setInitializingStatuses(false);
    }
  };

  const handleStatusChange = async (activityId: string, newStatus: EventStatus) => {
    try {
      // First check if the status record exists
      const existingStatus = eventStatuses[activityId];
      
      if (!existingStatus) {
        // If status doesn't exist, create a new one
        const { data: newRecord, error: insertError } = await supabase
          .from('event_statuses')
          .insert({ 
            activity_id: activityId,
            status: newStatus,
            event_type: newStatus, // Use the same value for both fields
            status_updated_at: new Date().toISOString() 
          })
          .select('*')
          .single();
          
        if (insertError) throw insertError;
        
        if (newRecord) {
          // Ensure the status is properly typed
          const typedNewRecord = {
            ...newRecord,
            status: ensureEventStatus(newRecord.status),
            event_type: ensureEventStatus(newRecord.event_type)
          };
        
          // Update local state
          setEventStatuses((prev) => ({
            ...prev,
            [activityId]: typedNewRecord,
          }));
          
          setActivities(prev => {
            return prev.map(activity => 
              activity.id === activityId 
                ? { ...activity, status: typedNewRecord } 
                : activity
            );
          });
          
          toast.success(`Status updated successfully`);
        }
        return;
      }
      
      // If the status record exists, update it
      const { error } = await supabase
        .from('event_statuses')
        .update({ 
          status: newStatus,
          event_type: newStatus, // Update the event_type to match the status
          status_updated_at: new Date().toISOString() 
        })
        .eq('id', existingStatus.id);

      if (error) throw error;

      const updatedStatusRecord = { 
        ...existingStatus, 
        status: newStatus,
        event_type: newStatus,
        status_updated_at: new Date().toISOString() 
      };
      
      setEventStatuses((prev) => ({
        ...prev,
        [activityId]: updatedStatusRecord,
      }));
      
      setActivities(prev => {
        return prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, status: updatedStatusRecord } 
            : activity
        );
      });

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
