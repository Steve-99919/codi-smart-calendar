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
import { getNextValidDate } from '@/utils/dateUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [filteredOutData, setFilteredOutData] = useState<CSVRow[]>([]);
  const [dataFiltered, setDataFiltered] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [reschedulingInProgress, setReschedulingInProgress] = useState(false);
  const [showTrackingSubscriptionDialog, setShowTrackingSubscriptionDialog] = useState(false);
  const [originalCsvData, setOriginalCsvData] = useState<CSVRow[]>([]);
  const [csvDataBeforeReschedule, setCsvDataBeforeReschedule] = useState<CSVRow[]>([]);
  const [reschedulePerformed, setReschedulePerformed] = useState(false);

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
      setShowPreferences(true);
      setReschedulePerformed(false);
      toast.success(`Successfully loaded ${parsedData.length} rows of data`);
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
  
  const handleTrackButtonClick = () => {
    setShowTrackingSubscriptionDialog(true);
  };
  
  const handleSubscribe = () => {
    toast.success('Subscription process would start here. For now, we\'ll simulate success');
    setShowTrackingSubscriptionDialog(false);
    saveToDatabase();
  };
  
  const saveToDatabase = async () => {
    const dataToSave = dataFiltered ? filteredData : csvData;
    
    if (dataToSave.length === 0) {
      toast.error('No data to save');
      return;
    }
    
    try {
      setSavingToDatabase(true);
      
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
    setOriginalCsvData(csvData);
    setPreferences(submittedPreferences);
    setShowPreferences(false);
    
    filterDataBasedOnPreferences(csvData, submittedPreferences);
    setReschedulePerformed(false);
  };

  const filterDataBasedOnPreferences = (data: CSVRow[], prefs: Preferences) => {
    toast.info('Processing data with your preferences...');
    
    const filtered: CSVRow[] = [];
    const filteredOut: CSVRow[] = [];
    
    data.forEach(row => {
      const prepDateParts = row.prepDate.split('/');
      const goDateParts = row.goDate.split('/');
      
      if (prepDateParts.length !== 3 || goDateParts.length !== 3) {
        filtered.push(row);
        return;
      }
      
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
      
      let shouldFilter = false;
      
      if (prefs.excludeWeekends) {
        const prepDay = prepDate.getDay();
        const goDay = goDate.getDay();
        if (prepDay === 0 || prepDay === 6 || goDay === 0 || goDay === 6) {
          shouldFilter = true;
        }
      }
      
      if (prefs.excludePublicHolidays && row.isHoliday) {
        shouldFilter = true;
      }
      
      for (const blockedDate of prefs.blockedDates) {
        if (
          blockedDate.getDate() === prepDate.getDate() && 
          blockedDate.getMonth() === prepDate.getMonth() &&
          blockedDate.getFullYear() === prepDate.getFullYear()
        ) {
          shouldFilter = true;
          break;
        }
        
        if (
          blockedDate.getDate() === goDate.getDate() && 
          blockedDate.getMonth() === goDate.getMonth() &&
          blockedDate.getFullYear() === goDate.getFullYear()
        ) {
          shouldFilter = true;
          break;
        }
      }
      
      if (shouldFilter) {
        filteredOut.push(row);
      } else {
        filtered.push(row);
      }
    });
    
    setFilteredData(filtered);
    setFilteredOutData(filteredOut);
    setDataFiltered(true);
    
    toast.success(`Filtered data: ${filtered.length} of ${data.length} activities match your preferences`);
    
    if (filteredOut.length > 0) {
      toast.info(`${filteredOut.length} activities were filtered out. You can reschedule them if needed.`);
    }
  };

  const handleRescheduleActivities = () => {
    setShowRescheduleDialog(true);
  };
  
  const rescheduleFilteredActivities = () => {
    if (filteredOutData.length === 0) {
      toast.info('No activities to reschedule');
      return;
    }
    
    setReschedulingInProgress(true);
    
    try {
      setCsvDataBeforeReschedule(csvData);
      const allActivities = [...csvData];
      allActivities.sort((a, b) => {
        const prepDateA = a.prepDate.split('/').map(Number);
        const prepDateB = b.prepDate.split('/').map(Number);
        const dateA = new Date(prepDateA[2], prepDateA[1] - 1, prepDateA[0]);
        const dateB = new Date(prepDateB[2], prepDateB[1] - 1, prepDateB[0]);
        return dateA.getTime() - dateB.getTime();
      });
      const dateAdjustments: Map<string, number> = new Map();

      const rescheduled = allActivities.map(activity => {
        const isFilteredOut = filteredOutData.some(filtered =>
          filtered.activityId === activity.activityId
        );

        if (!isFilteredOut) {
          let adjustedActivity = { ...activity };

          for (const [originalDate, daysToAdd] of dateAdjustments.entries()) {
            if (originalDate === activity.prepDate) {
              const newPrepDate = getNextValidDate(activity.prepDate, daysToAdd, preferences);
              const daysDiff = calculateDaysDifference(activity.prepDate, newPrepDate);

              adjustedActivity.prepDate = newPrepDate;

              adjustedActivity.goDate = getNextValidDate(activity.goDate, daysDiff, preferences);
              break;
            }

            if (originalDate === activity.goDate) {
              adjustedActivity.goDate = getNextValidDate(activity.goDate, daysToAdd, preferences);
              break;
            }
          }

          return adjustedActivity;
        }

        const daysToAdd = 7;

        const newPrepDate = getNextValidDate(activity.prepDate, daysToAdd, preferences);

        const actualDaysDiff = calculateDaysDifference(activity.prepDate, newPrepDate);

        const newGoDate = getNextValidDate(activity.goDate, actualDaysDiff, preferences);

        dateAdjustments.set(activity.prepDate, actualDaysDiff);
        dateAdjustments.set(activity.goDate, actualDaysDiff);

        const updatedActivity = {
          ...activity,
          prepDate: newPrepDate,
          goDate: newGoDate,
          isWeekend: false,
          isHoliday: false,
        };

        return updatedActivity;
      });

      setCsvData(rescheduled);
      setFilteredOutData([]);
      setDataFiltered(false);
      
      setReschedulePerformed(true);
      toast.success('Activities rescheduled successfully');
      toast.info('All activities now match your preferences');

    } catch (error) {
      console.error('Error during rescheduling:', error);
      toast.error('Failed to reschedule activities');
    } finally {
      setReschedulingInProgress(false);
      setShowRescheduleDialog(false);
    }
  };

  const calculateDaysDifference = (startDate: string, endDate: string): number => {
    const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
    const [endDay, endMonth, endYear] = endDate.split('/').map(Number);
    
    const date1 = new Date(startYear, startMonth - 1, startDay);
    const date2 = new Date(endYear, endMonth - 1, endDay);
    
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const resetToOriginalData = () => {
    setFilteredData([]);
    setFilteredOutData([]);
    setDataFiltered(false);
    setReschedulePerformed(false);
    toast.info('Reverted to original data. You can set preferences again.');
  };

  const handleClosePreferences = () => {
    setShowPreferences(false);
    toast.info('Preferences canceled. You can set them later by clicking "Set Preferences"');
  };

  const handleUndoPreferences = () => {
    if (csvDataBeforeReschedule.length === 0) {
      toast.info('No rescheduling to undo');
      return;
    }
    setCsvData(csvDataBeforeReschedule);
    setFilteredData([]);
    setFilteredOutData([]);
    setDataFiltered(false);
    setReschedulePerformed(false);
    toast.success('Rescheduling undone. Data restored to previous state.');
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
                  {dataFiltered && filteredOutData.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleRescheduleActivities}
                    >
                      Reschedule Filtered Activities
                    </Button>
                  )}

                  {dataFiltered ? (
                    <>
                      <GoogleCalendarImport data={filteredData} />

                      <Button
                        variant="outline"
                        onClick={resetToOriginalData}
                      >
                        Reset Filters
                      </Button>

                      {reschedulePerformed && (
                        <Button
                          variant="outline"
                          onClick={handleUndoPreferences}
                        >
                          Undo Reschedule
                        </Button>
                      )}
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
                      setFilteredOutData([]);
                      setDataFiltered(false);
                      setHasUploadedFile(false);
                      setReschedulePerformed(false);
                    }}
                  >
                    Upload another file
                  </Button>
                  <Button
                    onClick={handleTrackButtonClick}
                    disabled={savingToDatabase || (!dataFiltered && csvData.length > 0)}
                  >
                    Track My CSV
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
      
      <AlertDialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Filtered Activities</AlertDialogTitle>
            <AlertDialogDescription>
              This will reschedule {filteredOutData.length} filtered activities by pushing them one week forward.
              Any subsequent activities with conflicts will also be adjusted to maintain spacing.
              Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={rescheduleFilteredActivities}
              disabled={reschedulingInProgress}
            >
              {reschedulingInProgress ? 'Rescheduling...' : 'Reschedule'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
