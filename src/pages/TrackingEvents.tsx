
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

// New imports
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'done', label: 'Done' },
  { value: 'delayed', label: 'Delayed' },
];

// Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/');
};

// Helper function to get midnight of a date string (local)
const getDateMidnight = (dateStr: string) => {
  const d = new Date(dateStr);
  d.setHours(24, 0, 0, 0); // midnight next day
  return d;
};

const TrackingEvents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<string, any>>({}); // Map event_status id to status info
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [updatingStatuses, setUpdatingStatuses] = useState<{[key:string]: boolean}>({}); // track loading for status updates per event_status id

  // Fetch activities and statuses
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

        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', sessionData.session.user.id)
          .order('prep_date', { ascending: true });
        if (activitiesError) throw activitiesError;

        // Fetch event statuses for these activities
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

        // Build map from activity_id + event_type to status info
        const statusMap: Record<string, any> = {};
        statusesData.forEach((st) => {
          statusMap[`${st.activity_id}_${st.event_type}`] = st;
        });

        setActivities(activitiesData || []);
        setEventStatuses(statusMap);

        // After loading, process status auto updates for past dates with Pending status
        // We update each event_status with 'pending' which date passed midnight to 'done' automatically
        await autoUpdateStatuses(activitiesData || [], statusMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load activities and statuses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const autoUpdateStatuses = async (activitiesData: any[], statusMap: Record<string, any>) => {
    if (!activitiesData.length) return;
    let updatesCount = 0;

    const updates = [];

    for (const activity of activitiesData) {
      // Check PREP date
      const prepStatus = statusMap[`${activity.id}_prep`];
      if (prepStatus && prepStatus.status === 'pending') {
        // If PREP date midnight passed, update to done
        const midnight = getDateMidnight(activity.prep_date);
        if (new Date() >= midnight) {
          updates.push({
            id: prepStatus.id,
            status: 'done',
            status_updated_at: new Date().toISOString()
          });
          updatesCount++;
        }
      }
      // Check GO date
      const goStatus = statusMap[`${activity.id}_go`];
      if (goStatus && goStatus.status === 'pending') {
        // If GO date midnight passed, update to done
        const midnight = getDateMidnight(activity.go_date);
        if (new Date() >= midnight) {
          updates.push({
            id: goStatus.id,
            status: 'done',
            status_updated_at: new Date().toISOString()
          });
          updatesCount++;
        }
      }
    }

    if (updatesCount === 0) return;

    // Perform bulk update of event_statuses
    try {
      const updatesPromises = updates.map(({ id, status, status_updated_at }) =>
        supabase
          .from('event_statuses')
          .update({ status, status_updated_at })
          .eq('id', id)
      );
      await Promise.all(updatesPromises);

      // Update local state to reflect changes
      const newStatusMap = { ...statusMap };
      updates.forEach(({ id, status }) => {
        const stKey = Object.keys(newStatusMap).find((k) => newStatusMap[k].id === id);
        if (stKey) {
          newStatusMap[stKey] = { ...newStatusMap[stKey], status, status_updated_at: new Date().toISOString() };
        }
      });
      setEventStatuses(newStatusMap);
      toast.success(`Auto-updated ${updatesCount} event statuses to Done`);
    } catch (error) {
      console.error("Error auto updating statuses:", error);
      toast.error('Failed to auto update some statuses');
    }
  };

  // Handle manual status change for one event (prep or go)
  const handleStatusChange = async (activityId: string, eventType: 'prep' | 'go', newStatus: string) => {
    const statusKey = `${activityId}_${eventType}`;
    const statusRecord = eventStatuses[statusKey];
    if (!statusRecord) {
      toast.error('Status record not found');
      return;
    }

    if (statusRecord.status === newStatus) {
      // No change
      return;
    }

    try {
      setUpdatingStatuses(prev => ({ ...prev, [statusRecord.id]: true }));
      const { error } = await supabase
        .from('event_statuses')
        .update({ status: newStatus, status_updated_at: new Date().toISOString() })
        .eq('id', statusRecord.id);

      if (error) throw error;

      // Update local state
      setEventStatuses(prev => ({
        ...prev,
        [statusKey]: { ...statusRecord, status: newStatus, status_updated_at: new Date().toISOString() },
      }));

      toast.success(`Status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatuses(prev => ({ ...prev, [statusRecord.id]: false }));
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate('/tracking-events')} className="font-medium">
              Track Events
            </Button>
            <span className="text-gray-600">{userEmail}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PREP Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PREP Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GO Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GO Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity, index) => {
                    const prepStatus = eventStatuses[`${activity.id}_prep`];
                    const goStatus = eventStatuses[`${activity.id}_go`];

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.activity_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.activity_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{activity.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.strategy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.prep_date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {prepStatus ? (
                            <Select
                              value={prepStatus.status}
                              onValueChange={(value) => handleStatusChange(activity.id, 'prep', value)}
                              disabled={updatingStatuses[prepStatus.id]}
                            >
                              <SelectTrigger className="w-28 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-gray-400 italic">No status</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.go_date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {goStatus ? (
                            <Select
                              value={goStatus.status}
                              onValueChange={(value) => handleStatusChange(activity.id, 'go', value)}
                              disabled={updatingStatuses[goStatus.id]}
                            >
                              <SelectTrigger className="w-28 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-gray-400 italic">No status</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Activities</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all your tracked activities? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllActivities}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrackingEvents;

