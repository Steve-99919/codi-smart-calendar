
// We need to modify the TrackingEvents.tsx file to add a delete button
// Since the file is read-only, we'll create a new component that adds this functionality

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trash2 } from 'lucide-react';

// Original TrackingEvents component with added delete functionality
const TrackingEvents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/login');
          return;
        }
        setUserEmail(data.session.user.email);
        
        // Fetch activities
        const { data: activitiesData, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', data.session.user.id)
          .order('prep_date', { ascending: true });
        
        if (error) throw error;
        setActivities(activitiesData || []);
      } catch (error) {
        console.error('Error checking session or fetching activities:', error);
        toast.error('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);
  
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
  
  // Format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
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
                <trash2 className="h-4 w-4" />
                Delete All Activities
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GO Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.activity_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.activity_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{activity.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.strategy}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.prep_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.go_date)}</td>
                    </tr>
                  ))}
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
