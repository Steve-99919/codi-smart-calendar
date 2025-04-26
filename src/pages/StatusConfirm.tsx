import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

// Get the current app's URL, fallback to localhost for development
const APP_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:5173';

const StatusConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const status = searchParams.get('status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      if (!token || !status) {
        setError('Invalid parameters');
        setLoading(false);
        return;
      }

      if (status !== 'done' && status !== 'delayed') {
        setError('Invalid status value');
        setLoading(false);
        return;
      }

      try {
        // Decode token (format: activityId:statusId)
        let activityId, statusId;
        try {
          const decoded = atob(token);
          [activityId, statusId] = decoded.split(':');
        } catch (e) {
          throw new Error('Invalid token format');
        }

        // If statusId is 'new', we need to create a new status record
        if (statusId === 'new') {
          // First, get the activity to ensure it exists
          const { data: activity, error: activityError } = await supabase
            .from('activities')
            .select('*')
            .eq('id', activityId)
            .single();

          if (activityError || !activity) {
            throw new Error('Activity not found');
          }

          // Create new status record
          const { data, error: insertError } = await supabase
            .from('event_statuses')
            .insert({
              activity_id: activityId,
              status: status,
              status_updated_at: new Date().toISOString(),
              event_type: 'activity', // Adding the required event_type field
            })
            .select();

          if (insertError) {
            throw insertError;
          }

          setSuccess(true);
        } else {
          // Update existing status record
          const { error: updateError } = await supabase
            .from('event_statuses')
            .update({ 
              status: status,
              status_updated_at: new Date().toISOString()
            })
            .eq('id', statusId);

          if (updateError) {
            throw updateError;
          }

          setSuccess(true);
        }

        // Update the redirect logic to use dynamic APP_URL
        const confirmUrl = `${APP_URL}/status-confirm?token=${token}&status=done`;
        const delayUrl = `${APP_URL}/status-confirm?token=${token}&status=delayed`;

        // Rest of the code remains the same
      } catch (err: any) {
        console.error('Error updating status:', err);
        setError(err.message || 'Failed to update status');
      } finally {
        setLoading(false);
      }
    };

    updateStatus();
  }, [token, status]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
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
                {status === 'done' 
                  ? 'The activity status has been updated to "Done".' 
                  : 'The activity status has been updated to "Delayed".'}
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
