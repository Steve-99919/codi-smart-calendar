
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import CSVUpload from '@/components/CSVUpload';
import CSVTable from '@/components/CSVTable';
import GoogleCalendarImport from '@/components/GoogleCalendarImport';
import PreferencesForm, { Preferences } from '@/components/PreferencesForm';
import { parseCSV } from '@/utils/csvUtils';
import { CSVRow } from '@/types/csv';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [savingToDatabase, setSavingToDatabase] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    excludeWeekends: true,
    excludePublicHolidays: true,
    blockedDates: [],
    blockedMonths: []
  });
  const [filteredData, setFilteredData] = useState<CSVRow[]>([]);
  const [dataFiltered, setDataFiltered] = useState(false);

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
      setShowPreferences(true); // Show preferences form after upload
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
    if (dataFiltered) {
      setFilteredData(newData);
    } else {
      setCsvData(newData);
    }
  };
  
  const saveToDatabase = async () => {
    if (filteredData.length === 0 && !dataFiltered) {
      toast.error('Please apply preferences first');
      return;
    }
    
    const dataToSave = dataFiltered ? filteredData : csvData;
    
    if (dataToSave.length === 0) {
      toast.error('No data to save');
      return;
    }
    
    try {
      setSavingToDatabase(true);
      
      // Check for any PREP dates after GO dates
      const hasSequenceIssues = dataToSave.some(row => {
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
      const formattedData = dataToSave.map(row => {
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
      
      toast.success(`Successfully saved ${dataToSave.length} activities to database`);
      toast.info('You can now track these activities in the Tracking Events page');
      
    } catch (error: any) {
      console.error('Error saving to database:', error);
      toast.error(`Failed to save to database: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingToDatabase(false);
    }
  };

  const handlePreferencesSubmit = (submittedPreferences: Preferences) => {
    setPreferences(submittedPreferences);
    setShowPreferences(false);
    
    // Here we would normally send data to an AI service to filter
    // For now, we'll just simulate filtering with basic rules
    filterDataBasedOnPreferences(csvData, submittedPreferences);
  };

  const filterDataBasedOnPreferences = (data: CSVRow[], prefs: Preferences) => {
    // In a real implementation, this is where you'd call your AI service
    // For now, we'll just do basic filtering
    
    toast.info('Processing data with your preferences...');
    
    // This is a placeholder for the AI filtering logic
    // In reality, you'd send this to your AI service
    const filtered = data.filter(row => {
      // Parse dates
      const prepDateParts = row.prepDate.split('/');
      const goDateParts = row.goDate.split('/');
      
      if (prepDateParts.length !== 3 || goDateParts.length !== 3) return true;
      
      const prepDate = new Date(
        parseInt(prepDateParts[2]),
        parseInt(prepDateParts[1]) - 1,
        parseInt(prepDateParts[0])
      );
      
      const goDate = new Date(
        parseInt(goDateParts[2]),
        parseInt(goDateParts[1]) - 1,
        parseInt(goDateParts[0])
      );
      
      // Check weekend exclusion
      if (prefs.excludeWeekends) {
        const prepDay = prepDate.getDay();
        const goDay = goDate.getDay();
        if (prepDay === 0 || prepDay === 6 || goDay === 0 || goDay === 6) return false;
      }
      
      // Simplified holiday check - in real life, use a holiday API
      // Here we're just respecting the existing isHoliday flag if we want to exclude holidays
      if (prefs.excludePublicHolidays && (row.isHoliday)) return false;
      
      // Check blocked dates
      for (const blockedDate of prefs.blockedDates) {
        if (
          blockedDate.getDate() === prepDate.getDate() && 
          blockedDate.getMonth() === prepDate.getMonth() &&
          blockedDate.getFullYear() === prepDate.getFullYear()
        ) return false;
        
        if (
          blockedDate.getDate() === goDate.getDate() && 
          blockedDate.getMonth() === goDate.getMonth() &&
          blockedDate.getFullYear() === goDate.getFullYear()
        ) return false;
      }
      
      // Check blocked months
      if (
        prefs.blockedMonths.includes(prepDate.getMonth()) || 
        prefs.blockedMonths.includes(goDate.getMonth())
      ) return false;
      
      return true;
    });
    
    setFilteredData(filtered);
    setDataFiltered(true);
    toast.success(`Filtered data: ${filtered.length} of ${data.length} activities match your preferences`);
  };

  const resetToOriginalData = () => {
    setFilteredData([]);
    setDataFiltered(false);
    toast.info('Reverted to original data. You can set preferences again.');
  };

  const handleClosePreferences = () => {
    setShowPreferences(false);
    toast.info('Preferences canceled. You can set them later by clicking "Set Preferences"');
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
                  {dataFiltered ? (
                    <>
                      <GoogleCalendarImport data={filteredData} />
                      <Button 
                        variant="outline" 
                        onClick={resetToOriginalData}
                      >
                        Reset Filters
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setShowPreferences(true)}
                      variant="outline"
                    >
                      Set Preferences
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCsvData([]);
                      setFilteredData([]);
                      setDataFiltered(false);
                      setHasUploadedFile(false);
                    }}
                  >
                    Upload another file
                  </Button>
                  <Button 
                    onClick={saveToDatabase}
                    disabled={savingToDatabase || (!dataFiltered && csvData.length > 0)}
                  >
                    {savingToDatabase ? 'Saving...' : 'Save to Database'}
                  </Button>
                </div>
              </div>
              
              {(dataFiltered ? filteredData : csvData).length > 0 ? (
                <CSVTable 
                  data={dataFiltered ? filteredData : csvData} 
                  onUpdateData={handleUpdateData} 
                />
              ) : (
                <p className="text-center py-8 text-gray-500">No data available</p>
              )}
            </div>
          )}
        </div>
      </main>

      <PreferencesForm 
        isOpen={showPreferences}
        onClose={handleClosePreferences}
        onSubmit={handlePreferencesSubmit}
      />
    </div>
  );
};

export default Dashboard;
