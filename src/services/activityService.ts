
import { supabase } from '@/integrations/supabase/client';
import { CSVRow } from '@/types/csv';
import { toast } from "sonner";

export const checkExistingActivities = async (userId: string): Promise<boolean> => {
  try {
    const { data: existingActivities, error: checkError } = await supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (checkError) throw checkError;
    
    return existingActivities && existingActivities.length > 0;
  } catch (error) {
    console.error('Error checking activities:', error);
    throw error;
  }
};

export const saveActivitiesToDatabase = async (
  csvData: CSVRow[], 
  userId: string,
  onSuccess: () => void
): Promise<void> => {
  try {
    if (csvData.length === 0) {
      toast.error('No data to save');
      return;
    }
    
    const formattedData = csvData.map(row => {
      const prepParts = row.prepDate.split('/');
      const goParts = row.goDate.split('/');
      
      return {
        activity_id: row.activityId,
        activity_name: row.activityName,
        description: row.description,
        strategy: row.strategy,
        prep_date: `${prepParts[2]}-${prepParts[1]}-${prepParts[0]}`,
        go_date: `${goParts[2]}-${goParts[1]}-${goParts[0]}`,
        user_id: userId
      };
    });
    
    const { error } = await supabase
      .from('activities')
      .insert(formattedData);
    
    if (error) throw error;
    
    toast.success(`Successfully saved ${csvData.length} activities to database`);
    toast.info('You can now track these activities in the Tracking Events page');
    
    if (onSuccess) {
      onSuccess();
    }
  } catch (error: any) {
    console.error('Error saving to database:', error);
    toast.error(`Failed to save to database: ${error.message || 'Unknown error'}`);
    throw error;
  }
};

export const exportCSVFile = (csvData: CSVRow[]): void => {
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
