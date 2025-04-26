
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ActivityWithStatus, EventStatus } from '@/types/event';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DeleteConfirmationDialog from '@/components/tracking/DeleteConfirmationDialog';
import ActivitiesTable from '@/components/tracking/ActivitiesTable';
import { STATUS_OPTIONS } from '@/components/tracking/StatusSelect';

const TrackingEvents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityWithStatus[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<string, any>>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({});
  const [initializingStatuses, setInitializingStatuses] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          navigate('/login');
          return;
        }
        setUserEmail(sessionData.session.user.email);
        const userId = sessionData.session.user.id;

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

    fetchData();

  }, [navigate]);

  const initializeMissingStatuses = async (userId: string, activitiesData: any[], statusMap: Record<string, any>) => {
    if (!activitiesData.length) return;

    setInitializingStatuses(true);

    const missingStatusRecords = [];

    // First, let's fetch an existing status to see what event_type values are valid
    try {
      const { data: existingStatus } = await supabase
        .from('event_statuses')
        .select('event_type')
        .limit(1);
      
      const eventType = existingStatus && existingStatus.length > 0 
        ? existingStatus[0].event_type 
        : 'activity'; // Fallback if no existing records
      
      console.log('Using event_type:', eventType);

      for (const activity of activitiesData) {
        if (!statusMap[activity.id]) {
          missingStatusRecords.push({
            activity_id: activity.id,
            status: 'pending',
            status_updated_at: null,
            event_type: eventType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (missingStatusRecords.length === 0) {
        setInitializingStatuses(false);
        return;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('event_statuses')
        .insert(missingStatusRecords)
        .select();

      if (insertError) {
        console.error('Error inserting missing statuses:', insertError);
        toast.error('Failed to initialize some statuses');
        setInitializingStatuses(false);
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

  const handleStatusChange = async (activityId: string, newStatus: EventStatus) => {
    const statusRecord = eventStatuses[activityId];
    if (!statusRecord) {
      toast.error('Status record not found');
      return;
    }

    if (statusRecord.status === newStatus) {
      return;
    }

    try {
      setUpdatingStatus((prev) => ({ ...prev, [activityId]: true }));

      const { error } = await supabase
        .from('event_statuses')
        .update({ status: newStatus, status_updated_at: new Date().toISOString() })
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

      const label = STATUS_OPTIONS.find(o => o.value === newStatus)?.label || newStatus;
      toast.success(`Status updated to ${label}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleDeleteAllActivities = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('user_id', (await supabase.auth.getSession()).data.session?.user.id);

      if (error) throw error;

      setActivities([]);
      toast.success('All activities deleted successfully');
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error('Error deleting activities:', error);
      toast.error('Failed to delete activities');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || initializingStatuses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader 
        userEmail={userEmail} 
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Activity Tracking</h1>
            {activities.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirmation(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove table
              </Button>
            )}
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No activities found. Import some activities from the Dashboard.</p>
              <Button
                className="mt-4"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <ActivitiesTable 
              activities={activities}
              onStatusChange={handleStatusChange}
              updatingStatus={updatingStatus}
            />
          )}
        </div>
      </main>

      <DeleteConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleDeleteAllActivities}
        loading={deleting}
      />
    </div>
  );
};

export default TrackingEvents;
