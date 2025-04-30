
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DeleteConfirmationDialog from '@/components/tracking/DeleteConfirmationDialog';
import ActivitiesTable from '@/components/tracking/ActivitiesTable';
import EmptyActivities from '@/components/tracking/EmptyActivities';
import PerformanceMetrics from '@/components/tracking/PerformanceMetrics';
import { useActivities } from '@/hooks/useActivities';

const TrackingEvents = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userId, setUserId] = useState<string>();
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate('/login');
        return;
      }
      setUserEmail(sessionData.session.user.email);
      setUserId(sessionData.session.user.id);
    };

    checkSession();
  }, [navigate]);

  const {
    loading,
    activities,
    initializingStatuses,
    fetchActivities,
    handleStatusChange,
  } = useActivities(userId);

  useEffect(() => {
    if (userId) {
      fetchActivities();
    }
  }, [userId]);

  const handleDeleteAllActivities = async () => {
    if (!userId) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('All activities deleted successfully');
      setShowDeleteConfirmation(false);
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activities:', error);
      toast.error('Failed to delete activities');
    } finally {
      setDeleting(false);
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

  const handleActivityStatusChange = async (activityId: string, newStatus: EventStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [activityId]: true }));
    try {
      await handleStatusChange(activityId, newStatus);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [activityId]: false }));
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

          {activities.length > 0 && (
            <PerformanceMetrics activities={activities} />
          )}

          {activities.length === 0 ? (
            <EmptyActivities />
          ) : (
            <ActivitiesTable 
              activities={activities}
              onStatusChange={handleActivityStatusChange}
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
