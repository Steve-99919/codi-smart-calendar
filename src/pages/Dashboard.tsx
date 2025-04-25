import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import CSVUpload from '@/components/CSVUpload';
import CSVTable from '@/components/CSVTable';
import { parseCSV } from '@/utils/csvUtils';
import { CSVRow } from '@/types/csv';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardActions from '@/components/dashboard/DashboardActions';
import SubscriptionDialog from '@/components/dashboard/SubscriptionDialog';

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
      
      const processedData = parsedData.map((row, index) => {
        const match = row.activityId.match(/([A-Za-z]+)(\d+)/);
        if (!match) {
          return {
            ...row,
            activityId: `A${index + 1}`
          };
        }
        return row;
      });
      
      setCsvData(processedData);
      setHasUploadedFile(true);
      toast.success(`Successfully loaded ${processedData.length} rows of data`);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV file');
    }
  };

  const handleUpdateData = (newData: CSVRow[]) => {
    setCsvData(newData);
  };
  
  const handleTrackButtonClick = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to track activities');
        return;
      }

      const { data: existingActivities, error: checkError } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (checkError) throw checkError;

      if (existingActivities && existingActivities.length > 0) {
        toast.error('Please delete existing activities in the Tracking page before adding new ones');
        return;
      }

      setShowTrackingSubscriptionDialog(true);
    } catch (error) {
      console.error('Error checking activities:', error);
      toast.error('Failed to check tracking status');
    }
  };

  const handleExportCSV = () => {
    if (csvData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Activity ID,Activity Name,Description,Strategy,PREP Date,GO Date'];
    const rows = csvData.map(row => 
      `${row.activityId},${row.activityName},${row.description},${row.strategy},${row.prepDate},${row.goDate}`
    );
    const csvContent = `${headers}\n${rows.join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activities_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV file exported successfully');
  };

  const parseActivityId = (id: string) => {
    const match = id.match(/([A-Za-z]+)(\d+)/);
    return match ? { prefix: match[1], number: parseInt(match[2]) } : null;
  };

  const handleAddActivity = (newActivity: CSVRow) => {
    const newData = [...csvData];
    
    const insertIndex = newData.findIndex(
      item => !isDateBefore(item.prepDate, newActivity.prepDate)
    );
    
    if (insertIndex >= 0) {
      newData.splice(insertIndex, 0, newActivity);
      
      const prefixGroups = new Map<string, CSVRow[]>();
      
      newData.forEach(row => {
        const parsed = parseActivityId(row.activityId);
        if (parsed) {
          const { prefix } = parsed;
          if (!prefixGroups.has(prefix)) {
            prefixGroups.set(prefix, []);
          }
          prefixGroups.get(prefix)?.push(row);
        }
      });
      
      prefixGroups.forEach((rows, prefix) => {
        rows.sort((a, b) => {
          if (a.prepDate !== b.prepDate) {
            return isDateBefore(a.prepDate, b.prepDate) ? -1 : 1;
          }
          return 0;
        });
        
        rows.forEach((row, idx) => {
          row.activityId = `${prefix}${idx + 1}`;
        });
      });
    } else {
      newData.push(newActivity);
      
      const parsed = parseActivityId(newActivity.activityId);
      if (parsed) {
        const samePrefix = newData.filter(row => {
          const p = parseActivityId(row.activityId);
          return p?.prefix === parsed.prefix;
        });
        
        const numbers = samePrefix
          .map(row => {
            const p = parseActivityId(row.activityId);
            return p ? p.number : 0;
          })
          .filter(num => num > 0);
        
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        newActivity.activityId = `${parsed.prefix}${maxNumber + 1}`;
      }
    }
    
    setCsvData(newData);
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
      <DashboardHeader 
        userEmail={userEmail} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Smart Activity Manager</h1>
          
          {!hasUploadedFile ? (
            <CSVUpload onFileLoaded={handleFileLoaded} />
          ) : (
            <div className="space-y-6">
              <DashboardActions
                onAddActivity={handleAddActivity}
                data={csvData}
                onExportCSV={handleExportCSV}
                onUploadAnother={() => {
                  setCsvData([]);
                  setHasUploadedFile(false);
                }}
                onTrackCSV={handleTrackButtonClick}
                savingToDatabase={savingToDatabase}
              />
              
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

      <SubscriptionDialog
        open={showTrackingSubscriptionDialog}
        onOpenChange={setShowTrackingSubscriptionDialog}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
};

export default Dashboard;
