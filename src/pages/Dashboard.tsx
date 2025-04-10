
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [savingToDatabase, setSavingToDatabase] = useState(false);

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
      
      // Check for weekend or holiday dates
      const hasIssues = parsedData.some(row => row.isWeekend || row.isHoliday);
      if (hasIssues) {
        toast.warning('Some dates fall on weekends or public holidays (highlighted in red)');
      }
      
      // Check for PREP dates that are after GO dates
      const hasSequenceIssues = parsedData.some(row => {
        const prepParts = row.prepDate.split('/');
        const goParts = row.goDate.split('/');
        if (prepParts.length === 3 && goParts.length === 3) {
          const prepDate = new Date(
            parseInt(prepParts[2]), 
            parseInt(prepParts[1]) - 1, 
            parseInt(prepParts[0])
          );
          const goDate = new Date(
            parseInt(goParts[2]), 
            parseInt(goParts[1]) - 1, 
            parseInt(goParts[0])
          );
          return prepDate > goDate;
        }
        return false;
      });
      
      if (hasSequenceIssues) {
        toast.warning('Some activities have PREP dates after GO dates (highlighted in amber)');
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV file');
    }
  };

  const handleUpdateData = (newData: CSVRow[]) => {
    setCsvData(newData);
  };
  
  const saveToDatabase = async () => {
    if (csvData.length === 0) return;
    
    try {
      setSavingToDatabase(true);
      
      // Check for any PREP dates after GO dates
      const hasSequenceIssues = csvData.some(row => {
        const prepParts = row.prepDate.split('/');
        const goParts = row.goDate.split('/');
        if (prepParts.length === 3 && goParts.length === 3) {
          const prepDate = new Date(
            parseInt(prepParts[2]), 
            parseInt(prepParts[1]) - 1, 
            parseInt(prepParts[0])
          );
          const goDate = new Date(
            parseInt(goParts[2]), 
            parseInt(goParts[1]) - 1, 
            parseInt(goParts[0])
          );
          return prepDate > goDate;
        }
        return false;
      });
      
      if (hasSequenceIssues) {
        toast.error('Cannot save to database. Please correct PREP dates that occur after GO dates.');
        setSavingToDatabase(false);
        return;
      }
      
      // Format dates as YYYY-MM-DD for PostgreSQL
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
      
      // Get the current user's ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to save activities');
        setSavingToDatabase(false);
        return;
      }
      
      // Add user_id to each activity
      const activitiesWithUserId = formattedData.map(activity => ({
        ...activity,
        user_id: session.user.id
      }));
      
      // Insert into database
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
                <h2 className="text-xl font-semibold">Activity Data</h2>
                <div className="flex gap-2">
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
                    onClick={saveToDatabase}
                    disabled={savingToDatabase}
                  >
                    {savingToDatabase ? 'Saving...' : 'Save to Database'}
                  </Button>
                </div>
              </div>
              
              {csvData.length > 0 ? (
                <CSVTable data={csvData} onUpdateData={handleUpdateData} />
              ) : (
                <p className="text-center py-8 text-gray-500">No data available</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
