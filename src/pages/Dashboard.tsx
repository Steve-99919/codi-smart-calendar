
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import CSVUpload from '@/components/CSVUpload';
import CSVTable from '@/components/CSVTable';
import GoogleCalendarImport from '@/components/GoogleCalendarImport';
import { parseCSV } from '@/utils/csvUtils';
import { CSVRow } from '@/types/csv';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddActivityForm from '@/components/AddActivityForm';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [savingToDatabase, setSavingToDatabase] = useState(false);
  const [showTrackingSubscriptionDialog, setShowTrackingSubscriptionDialog] = useState(false);

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleFileLoaded = (content: string) => {
    try {
      const parsedData = parseCSV(content);
      if (parsedData.length === 0) {
        toast.error('No valid data found in CSV file');
        return;
      }
      
      setCsvData(parsedData);
      setHasUploadedFile(true);
      toast.success(`Successfully loaded ${parsedData.length} rows of data`);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV file');
    }
  };

  const handleUpdateData = (newData: CSVRow[]) => {
    setCsvData(newData);
  };
  
  const handleTrackButtonClick = () => {
    setShowTrackingSubscriptionDialog(true);
  };
  
  const handleSubscribe = () => {
    toast.success('Subscription process would start here. For now, we\'ll simulate success');
    setShowTrackingSubscriptionDialog(false);
    saveToDatabase();
  };

  const handleAddActivity = (newActivity: CSVRow) => {
    // Convert ID to number for comparison
    const newId = parseInt(newActivity.activityId);
    
    // Create a new array with activities properly ordered
    const newData = [...csvData];
    
    // Find the index where to insert the new activity
    const insertIndex = newData.findIndex(
      item => parseInt(item.activityId) >= newId
    );
    
    if (insertIndex >= 0) {
      // Insert at specific index and update IDs for all subsequent activities
      newData.splice(insertIndex, 0, newActivity);
      
      // Update IDs for all activities after the insertion point
      for (let i = insertIndex + 1; i < newData.length; i++) {
        newData[i].activityId = (parseInt(newData[i].activityId) + 1).toString();
      }
    } else {
      // If no higher ID is found, add to the end
      newData.push(newActivity);
    }
    
    setCsvData(newData);
    toast.success(`Successfully added activity: ${newActivity.activityName}`);
  };
  
  const saveToDatabase = async () => {
    if (csvData.length === 0) {
      toast.error('No data to save');
      return;
    }
    
    try {
      setSavingToDatabase(true);
      
      const formattedData = csvData.map(row => {
        const prepParts = row.prepDate.split('/');
        const goParts = row.goDate.split('/');
        
        return {
          activity_id: row.activityId,
          activity_name: row.activityName,
          description: row.description,
          strategy: row.strategy,
          prep_date: `${prepParts[2]}-${prepParts[1]}-${prepParts[0]}`,
          go_date: `${goParts[2]}-${goParts[1]}-${goParts[0]}`
        };
      });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to save activities');
        setSavingToDatabase(false);
        return;
      }
      
      const activitiesWithUserId = formattedData.map(activity => ({
        ...activity,
        user_id: session.user.id
      }));
      
      const { error } = await supabase
        .from('activities')
        .insert(activitiesWithUserId);
      
      if (error) throw error;
      
      toast.success(`Successfully saved ${csvData.length} activities to database`);
      toast.info('You can now track these activities in the Tracking Events page');
      
    } catch (error: any) {
      console.error('Error saving to database:', error);
      toast.error(`Failed to save to database: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingToDatabase(false);
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
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="font-medium">
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate('/tracking-events')}>
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
          <h1 className="text-2xl font-bold mb-4">CSV Activity Management</h1>
          
          {!hasUploadedFile ? (
            <CSVUpload onFileLoaded={handleFileLoaded} />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                </h2>
                <div className="flex gap-2">
                  <AddActivityForm 
                    data={csvData} 
                    onAddActivity={handleAddActivity} 
                  />
                  <GoogleCalendarImport data={csvData} />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCsvData([]);
                      setHasUploadedFile(false);
                    }}
                  >
                    Upload another file
                  </Button>
                  <Button
                    onClick={handleTrackButtonClick}
                    disabled={savingToDatabase || (!csvData.length)}
                  >
                    Track My CSV
                  </Button>
                </div>
              </div>
              
              {csvData.length > 0 ? (
                <CSVTable
                  data={csvData}
                  onUpdateData={handleUpdateData}
                />
              ) : (
                <p className="text-center py-8 text-gray-500">No data available</p>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showTrackingSubscriptionDialog} onOpenChange={setShowTrackingSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Tracking Subscription</DialogTitle>
            <DialogDescription>
              Track your activities with our Premium subscription.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border p-4 mb-4 bg-green-50">
              <h3 className="text-lg font-medium mb-2">Premium Tracking Features</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Save unlimited activities to your tracking dashboard</li>
                <li>View upcoming activities sorted by date</li>
                <li>Receive email notifications for upcoming events</li>
                <li>Export your tracking data anytime</li>
              </ul>
              <div className="mt-4 text-center">
                <span className="text-2xl font-bold">$99</span>
                <span className="text-sm font-medium"> AUD / month</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrackingSubscriptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe}>
              Subscribe Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
