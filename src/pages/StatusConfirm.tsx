
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
        console.log("Processing token:", token);
        console.log("Status:", status);
        
        // Decode token (format: activityId:statusId)
        let activityId, statusId;
        try {
          // First try standard base64 decoding
          const decoded = atob(token);
          console.log("Decoded token:", decoded);
          [activityId, statusId] = decoded.split(':');
        } catch (e) {
          console.error("Failed with standard base64 decoding, trying URL-safe decoding:", e);
          
          // If standard decoding fails, try URL-safe base64 decoding
          try {
            // Replace URL-safe chars and add padding if needed
            const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
            const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
            const decoded = atob(paddedBase64);
            console.log("Decoded token with URL-safe method:", decoded);
            [activityId, statusId] = decoded.split(':');
          } catch (e2) {
            console.error("Token decoding failed with both methods:", e2);
            throw new Error('Invalid token format');
          }
        }
        
        console.log("ActivityId:", activityId, "StatusId:", statusId);
        
        if (!activityId) {
          throw new Error('Missing activity ID in token');
        }

        // If statusId is 'new', we need to create a new status record
        if (statusId === 'new') {
          console.log("Creating new status record for activity:", activityId);
          
          // First, verify the activity exists
          const { data: activity, error: activityError } = await supabase
            .from('activities')
            .select('*')
            .eq('id', activityId)
            .maybeSingle();

          if (activityError) {
            console.error("Activity fetch error:", activityError);
            throw new Error(`Database error: ${activityError.message}`);
          }

          if (!activity) {
            console.error("Activity not found with ID:", activityId);
            throw new Error(`Activity with ID ${activityId} not found. This may be because the activity was deleted or the token is invalid.`);
          }

          console.log("Activity found:", activity);

          // Create new status record
          const { data, error: insertError } = await supabase
            .from('event_statuses')
            .insert({
              activity_id: activityId,
              status: status,
              status_updated_at: new Date().toISOString(),
              event_type: 'activity',
            })
            .select();

          if (insertError) {
            console.error("Status insert error:", insertError);
            throw new Error(`Failed to create status record: ${insertError.message}`);
          }

          console.log("New status created:", data);
          setSuccess(true);
        } else {
          console.log("Updating existing status record:", statusId);
          
          // Verify the status record exists
          const { data: statusRecord, error: statusError } = await supabase
            .from('event_statuses')
            .select('*')
            .eq('id', statusId)
            .maybeSingle();
            
          if (statusError) {
            console.error("Status fetch error:", statusError);
            throw new Error(`Database error: ${statusError.message}`);
          }
          
          if (!statusRecord) {
            console.error("Status record not found with ID:", statusId);
            
            // If status record doesn't exist, we should check if the activity exists
            const { data: activity, error: activityError } = await supabase
              .from('activities')
              .select('*')
              .eq('id', activityId)
              .maybeSingle();
            
            if (activityError || !activity) {
              console.error("Activity not found with ID:", activityId);
              throw new Error(`Activity with ID ${activityId} not found. This may be because the activity was deleted.`);
            }
            
            // If activity exists but status doesn't, create a new status
            console.log("Activity exists but status doesn't, creating new status");
            const { data, error: insertError } = await supabase
              .from('event_statuses')
              .insert({
                activity_id: activityId,
                status: status,
                status_updated_at: new Date().toISOString(),
                event_type: 'activity',
              })
              .select();
              
            if (insertError) {
              console.error("Status insert error:", insertError);
              throw new Error(`Failed to create status record: ${insertError.message}`);
            }
            
            console.log("New status created:", data);
            setSuccess(true);
            return;
          }
          
          // Update existing status record
          const { error: updateError } = await supabase
            .from('event_statuses')
            .update({ 
              status: status,
              status_updated_at: new Date().toISOString()
            })
            .eq('id', statusId);

          if (updateError) {
            console.error("Status update error:", updateError);
            throw new Error(`Failed to update status: ${updateError.message}`);
          }

          console.log("Status updated successfully");
          setSuccess(true);
        }
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
