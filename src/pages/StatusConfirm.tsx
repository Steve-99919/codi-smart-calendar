
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

const StatusConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const status = searchParams.get('status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activityName, setActivityName] = useState<string | null>(null);

  // Helper function to map statuses for display
  const getDisplayStatus = (status: string): string => {
    if (status === 'completed') return 'Completed';
    if (status === 'done') return 'Completed';
    if (status === 'delayed') return 'Delayed';
    if (status === 'upcoming') return 'Upcoming';
    if (status === 'pending') return 'Upcoming';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  useEffect(() => {
    const processStatus = async () => {
      if (!token || !status) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }

      // Accept both 'completed' and 'done' for completion status
      // Accept both 'upcoming' and 'pending' for upcoming status 
      const validStatuses = ['upcoming', 'completed', 'delayed', 'pending', 'done'];
      if (!validStatuses.includes(status)) {
        setError('Invalid status value');
        setLoading(false);
        return;
      }

      try {
        // Call the edge function directly with the full URL
        console.log(`Processing token: ${token}, status: ${status}`);
        const response = await fetch(
          `https://pueoiaivzdbhiygylkok.supabase.co/functions/v1/update-activity-status?token=${token}&status=${status}`
        );
        
        const result = await response.json();
        console.log('Response from update-activity-status:', result);
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to update status');
        }
        
        setSuccess(true);
        setActivityName(result.activity);
        toast.success('Status updated successfully!');
        console.log('Status update successful:', result);
      } catch (err: any) {
        console.error('Error updating status:', err);
        setError(err.message || 'Failed to update status');
      } finally {
        setLoading(false);
      }
    };

    processStatus();
  }, [token, status]);

  const handleGoToDashboard = () => {
    // Check if user is authenticated before navigating
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Logo />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-lg">Updating activity status...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <XCircle className="h-16 w-16" />
              <h2 className="mt-4 text-xl font-semibold">Error</h2>
              <p className="mt-2">{error}</p>
              <Button 
                className="mt-6"
                onClick={handleGoToDashboard}
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-green-600">
              <CheckCircle className="h-16 w-16" />
              <h2 className="mt-4 text-xl font-semibold">Status Updated Successfully</h2>
              <p className="mt-2">
                {activityName ? (
                  <>
                    The status for activity "{activityName}" has been updated to{" "}
                    <strong>{getDisplayStatus(status || '')}</strong>.
                  </>
                ) : (
                  <>
                    The activity status has been updated to{" "}
                    <strong>{getDisplayStatus(status || '')}</strong>.
                  </>
                )}
              </p>
              <Button 
                className="mt-6"
                onClick={handleGoToDashboard}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StatusConfirm;
