
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Undo } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import CSVUpload from '@/components/CSVUpload';
import CSVTable from '@/components/CSVTable';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardActions from '@/components/dashboard/DashboardActions';
import SubscriptionDialog from '@/components/dashboard/SubscriptionDialog';
import { useCSVPersistence } from '@/hooks/useCSVPersistence';
import { checkExistingActivities, saveActivitiesToDatabase, exportCSVFile } from '@/services/activityService';
import { addActivity } from '@/services/activityDataService';
import { CSVRow } from '@/types/csv';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showTrackingSubscriptionDialog, setShowTrackingSubscriptionDialog] = useState(false);
  const [savingToDatabase, setSavingToDatabase] = useState(false);
  const [csvHistory, setCsvHistory] = useState<CSVRow[][]>([]);
  
  // Use our custom hook for CSV data persistence
  const {
    csvData,
    setCsvData,
    hasUploadedFile,
    setHasUploadedFile,
    handleFileLoaded,
    updateData,
    clearData
  } = useCSVPersistence();

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
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  // Store history when CSV data changes
  useEffect(() => {
    if (csvData.length > 0) {
      setCsvHistory(prev => [...prev, [...csvData]]);
    }
  }, [csvData]);

  const handleUndo = () => {
    if (csvHistory.length > 1) {
      // Get the previous state
      const previousState = csvHistory[csvHistory.length - 2];
      
      // Update the current data
      setCsvData([...previousState]);
      
      // Remove the last history entry
      setCsvHistory(prev => prev.slice(0, -1));
      
      toast.success('Undo successful');
    } else {
      toast.info('Nothing to undo');
    }
  };

  const handleLogout = async () => {
    try {
      clearData(); // Clear saved CSV data on logout
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleTrackButtonClick = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to track activities');
        return;
      }

      const hasExistingActivities = await checkExistingActivities(session.user.id);
      
      if (hasExistingActivities) {
        toast.error('Please delete existing activities in the Tracking page before adding new ones');
        return;
      }

      setShowTrackingSubscriptionDialog(true);
    } catch (error) {
      console.error('Error checking activities:', error);
      toast.error('Failed to check tracking status');
    }
  };

  const handleAddActivity = (newActivity: CSVRow) => {
    // Save current state to history before modifying
    setCsvHistory(prev => [...prev, [...csvData]]);
    
    const updatedData = addActivity(csvData, newActivity);
    setCsvData(updatedData);
    toast.success(`Successfully added activity: ${newActivity.activityName}`);
  };
  
  const handleSubscribe = () => {
    toast.success('Subscription process would start here. For now, we\'ll simulate success');
    setShowTrackingSubscriptionDialog(false);
    saveToDatabase();
  };

  const saveToDatabase = async () => {
    if (csvData.length === 0) {
      toast.error('No data to save');
      return;
    }
    
    try {
      setSavingToDatabase(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to save activities');
        setSavingToDatabase(false);
        return;
      }
      
      await saveActivitiesToDatabase(csvData, session.user.id, () => {
        // On success callback
      });
      
    } catch (error) {
      console.error('Error in save to database process:', error);
    } finally {
      setSavingToDatabase(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader 
        userEmail={userEmail} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Smart Activity Manager</h1>
            {hasUploadedFile && csvHistory.length > 1 && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="flex items-center gap-2"
              >
                <Undo className="h-4 w-4" />
                Undo
              </Button>
            )}
          </div>
          
          {!hasUploadedFile ? (
            <CSVUpload onFileLoaded={handleFileLoaded} />
          ) : (
            <div className="space-y-6 mt-4">
              <DashboardActions
                onAddActivity={handleAddActivity}
                data={csvData}
                onExportCSV={() => exportCSVFile(csvData)}
                onUploadAnother={clearData}
                onTrackCSV={handleTrackButtonClick}
                savingToDatabase={savingToDatabase}
              />
              
              {csvData.length > 0 ? (
                <CSVTable
                  data={csvData}
                  onUpdateData={(newData) => {
                    // Save current state to history before updating
                    setCsvHistory(prev => [...prev, [...csvData]]);
                    updateData(newData);
                  }}
                />
              ) : (
                <p className="text-center py-8 text-gray-500">No data available</p>
              )}
            </div>
          )}
        </div>
      </main>

      <SubscriptionDialog
        open={showTrackingSubscriptionDialog}
        onOpenChange={setShowTrackingSubscriptionDialog}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
};

export default Dashboard;
