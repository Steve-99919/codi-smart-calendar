
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isBefore, parseISO } from 'date-fns';
import { Calendar, Check, Clock, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import { ActivityWithStatus, EventStatus } from '@/types/event';

const TrackingEvents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityWithStatus[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithStatus | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<'prep' | 'go' | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EventStatus>('done');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/login');
          return;
        }
        setUserEmail(data.session.user.email);
        await loadActivities();
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const loadActivities = async () => {
    try {
      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('prep_date', { ascending: true });
      
      if (activitiesError) throw activitiesError;
      
      // Fetch event statuses
      const { data: statusesData, error: statusesError } = await supabase
        .from('event_statuses')
        .select('*');
      
      if (statusesError) throw statusesError;
      
      // Combine data
      const activitiesWithStatus = activitiesData.map(activity => {
        const activityStatuses = statusesData.filter(status => 
          status.activity_id === activity.id
        );
        
        return {
          ...activity,
          prep_status: activityStatuses.find(s => s.event_type === 'prep'),
          go_status: activityStatuses.find(s => s.event_type === 'go')
        };
      });
      
      setActivities(activitiesWithStatus);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Failed to load activities');
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

  const getStatusBadge = (status: EventStatus | undefined) => {
    if (!status) return <Badge variant="outline">Not Set</Badge>;
    
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'done':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Done</Badge>;
      case 'fail':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getEventIcon = (status: EventStatus | undefined) => {
    if (!status || status === 'pending') return <Clock className="h-4 w-4 text-yellow-500" />;
    if (status === 'done') return <Check className="h-4 w-4 text-green-500" />;
    return <X className="h-4 w-4 text-red-500" />;
  };

  const openUpdateDialog = (activity: ActivityWithStatus, eventType: 'prep' | 'go') => {
    setSelectedActivity(activity);
    setSelectedEventType(eventType);
    setSelectedStatus('done'); // Default to 'done'
    setNotes('');
  };

  const updateEventStatus = async () => {
    if (!selectedActivity || !selectedEventType) return;
    
    try {
      const eventStatus = selectedEventType === 'prep' 
        ? selectedActivity.prep_status
        : selectedActivity.go_status;
      
      const now = new Date().toISOString();
      
      if (eventStatus) {
        // Update existing status
        const { error } = await supabase
          .from('event_statuses')
          .update({
            status: selectedStatus,
            status_updated_at: now,
            notes: notes || null,
            updated_at: now
          })
          .eq('id', eventStatus.id);
          
        if (error) throw error;
      } else {
        // Insert new status
        const { error } = await supabase
          .from('event_statuses')
          .insert({
            activity_id: selectedActivity.id,
            event_type: selectedEventType,
            status: selectedStatus,
            status_updated_at: now,
            notes: notes || null
          });
          
        if (error) throw error;
      }
      
      toast.success('Event status updated successfully');
      setSelectedActivity(null);
      setSelectedEventType(null);
      loadActivities();
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const isOverdue = (dateStr: string, status: EventStatus | undefined) => {
    if (status && status !== 'pending') return false;
    
    try {
      const eventDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isBefore(eventDate, today);
    } catch (e) {
      return false;
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
          <div className="flex items-center space-x-4">
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
          <h1 className="text-2xl font-bold mb-6">Track Activity Events</h1>

          {activities.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No activities found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload some CSV data in the dashboard to get started.
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Activities</CardTitle>
                <CardDescription>Track the status of your PREP and GO events</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>PREP Date</TableHead>
                      <TableHead>PREP Status</TableHead>
                      <TableHead>GO Date</TableHead>
                      <TableHead>GO Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.activity_id}</TableCell>
                        <TableCell>{activity.activity_name}</TableCell>
                        <TableCell className={isOverdue(activity.prep_date, activity.prep_status?.status) ? 'text-red-600 font-semibold' : ''}>
                          {formatDate(activity.prep_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getEventIcon(activity.prep_status?.status)}
                            {getStatusBadge(activity.prep_status?.status)}
                          </div>
                        </TableCell>
                        <TableCell className={isOverdue(activity.go_date, activity.go_status?.status) ? 'text-red-600 font-semibold' : ''}>
                          {formatDate(activity.go_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getEventIcon(activity.go_status?.status)}
                            {getStatusBadge(activity.go_status?.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openUpdateDialog(activity, 'prep')}
                            className="inline-flex items-center"
                          >
                            <Calendar className="mr-1 h-3 w-3" /> PREP
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openUpdateDialog(activity, 'go')}
                            className="inline-flex items-center"
                          >
                            <Calendar className="mr-1 h-3 w-3" /> GO
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  Update the status of your events to keep track of progress
                </p>
              </CardFooter>
            </Card>
          )}

          {/* Update Status Dialog */}
          <Dialog 
            open={!!selectedActivity && !!selectedEventType} 
            onOpenChange={(open) => {
              if (!open) {
                setSelectedActivity(null);
                setSelectedEventType(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Update {selectedEventType?.toUpperCase()} Status
                </DialogTitle>
                <DialogDescription>
                  {selectedActivity?.activity_name}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 gap-4">
                  <Button 
                    variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                    className="flex-col h-auto py-4"
                    onClick={() => setSelectedStatus('pending')}
                  >
                    <Clock className="h-6 w-6 mb-2" />
                    <span>Pending</span>
                  </Button>
                  <Button 
                    variant={selectedStatus === 'done' ? 'default' : 'outline'}
                    className="flex-col h-auto py-4"
                    onClick={() => setSelectedStatus('done')}
                  >
                    <Check className="h-6 w-6 mb-2" />
                    <span>Done</span>
                  </Button>
                  <Button 
                    variant={selectedStatus === 'fail' ? 'default' : 'outline'}
                    className="flex-col h-auto py-4"
                    onClick={() => setSelectedStatus('fail')}
                  >
                    <X className="h-6 w-6 mb-2" />
                    <span>Failed</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any comments or notes about this status update"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setSelectedActivity(null);
                  setSelectedEventType(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={updateEventStatus}>
                  Save Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default TrackingEvents;
