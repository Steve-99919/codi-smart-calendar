
import { useState, useEffect } from 'react';
import { CSVRow } from '@/types/csv';
import { useActivitySettings } from './useActivitySettings';
import { useActivityFormState } from './useActivityFormState';
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { getNextNumber, parseActivityId, getNextAvailableNumber } from '@/services/activityDataService';
import { toast } from "sonner";
import { format } from "date-fns";

interface UseActivityFormProps {
  data: CSVRow[];
  onAddActivity: (newActivity: CSVRow) => void;
}

export const useActivityForm = ({ data, onAddActivity }: UseActivityFormProps) => {
  const [activityIdPrefix, setActivityIdPrefix] = useState<string>('A');
  
  const { 
    showPreferenceDialog,
    setShowPreferenceDialog,
    showAddForm,
    setShowAddForm,
    allowWeekends,
    setAllowWeekends,
    allowHolidays,
    setAllowHolidays,
    handleOpenPreferences,
    handleProceedToForm,
    handleCancelPreferences,
    handleCloseForm
  } = useActivitySettings();
  
  const {
    selectedPrepDate,
    selectedGoDate,
    newActivity,
    isProcessingActivity,
    setIsProcessingActivity,
    handlePrepDateSelect,
    handleGoDateSelect,
    handleInputChange,
    validateForm,
    resetForm,
    setNewActivity
  } = useActivityFormState({
    data,
    activityIdPrefix,
    allowWeekends,
    allowHolidays
  });

  // Detect the most common prefix whenever data changes
  useEffect(() => {
    console.log("Data changed, detecting most common prefix...", data?.length || 0, "rows");
    
    if (!data || data.length === 0) {
      console.log("No data available for prefix detection");
      return;
    }
    
    const prefixCounts: Record<string, number> = {};
    
    // Extract prefixes using our regex parser
    data.forEach((row) => {
      if (!row.activityId) {
        console.log("Skipping row with no activityId");
        return;
      }
      
      console.log("Processing row:", row.activityId);
      const parsed = parseActivityId(row.activityId);
      if (parsed && parsed.prefix) {
        console.log("Parsed prefix:", parsed.prefix, "number:", parsed.number);
        const prefix = parsed.prefix;
        prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
      } else {
        console.log("Failed to parse prefix from:", row.activityId);
      }
    });
    
    console.log("Prefix counts:", prefixCounts);
    
    // Sort by count to find most common prefix
    const sortedPrefixes = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1]);
    const mostCommonPrefix = sortedPrefixes[0]?.[0];
    
    if (mostCommonPrefix) {
      console.log("Setting detected prefix to:", mostCommonPrefix);
      setActivityIdPrefix(mostCommonPrefix);
    } else {
      console.log("No valid prefix detected, using default: A");
    }
  }, [data]);  // This effect runs whenever 'data' changes

  // Generate Activity ID based on activity name and go date
  const generateActivityId = () => {
    console.log("Generating activity ID with name:", newActivity.activityName, "and date:", selectedGoDate);
    
    if (!newActivity.activityName || !selectedGoDate) {
      toast.error("Please provide both activity name and go date");
      return;
    }

    // Get initials from activity name (first letter of each word)
    const initials = newActivity.activityName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');

    // Format the date for the ID
    const month = format(selectedGoDate, 'MMM').toUpperCase();
    const day = format(selectedGoDate, 'dd');
    const year = format(selectedGoDate, 'yy');

    // Construct the ID in format [Initials]-[Month][Day]-[Year]
    const generatedId = `${initials}-${month}${day}-${year}`;
    
    console.log("Generated activity ID:", generatedId);
    
    setNewActivity(prev => ({
      ...prev,
      activityId: generatedId
    }));
    
    toast.success("Activity ID generated successfully");
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow more complex prefixes including dashes and underscores
    const newPrefix = e.target.value.replace(/[^A-Za-z0-9\-_]/g, '');
    console.log("User changing prefix to:", newPrefix);
    setActivityIdPrefix(newPrefix || 'A');
  };
  
  const handleOpenAddActivity = () => {
    console.log("Opening Add Activity dialog");
    setShowPreferenceDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitActivity();
    }
  };
  
  const submitActivity = () => {
    if (isProcessingActivity) return;
    
    setIsProcessingActivity(true);
    
    try {
      if (!newActivity.activityId) {
        toast.error("Please generate an activity ID before submitting");
        setIsProcessingActivity(false);
        return;
      }
      
      const activityToAdd = {
        ...newActivity,
        isWeekend: isWeekend(newActivity.prepDate) || isWeekend(newActivity.goDate),
        isHoliday: isPublicHoliday(newActivity.prepDate) || isPublicHoliday(newActivity.goDate)
      };
      
      onAddActivity(activityToAdd);
      resetForm();
      setShowAddForm(false);
      
      setTimeout(() => {
        setIsProcessingActivity(false);
      }, 300);
    } catch (error) {
      console.error('Error submitting activity:', error);
      setIsProcessingActivity(false);
      toast.error("An error occurred while adding the activity");
    }
  };

  return {
    showPreferenceDialog,
    setShowPreferenceDialog,
    showAddForm,
    setShowAddForm,
    allowWeekends,
    setAllowWeekends,
    allowHolidays,
    setAllowHolidays,
    selectedPrepDate,
    selectedGoDate,
    activityIdPrefix,
    newActivity,
    handlePrefixChange,
    handlePrepDateSelect,
    handleGoDateSelect,
    handleOpenAddActivity,
    handleProceedToForm,
    handleInputChange,
    handleSubmit,
    generateActivityId, // Ensure generateActivityId is explicitly returned
    getNextNumber: (prefix: string) => getNextAvailableNumber(data, prefix),
    data
  };
};
