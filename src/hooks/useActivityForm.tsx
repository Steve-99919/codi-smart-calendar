
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

// Helper function to generate abbreviated month
const getMonthAbbreviation = (date: Date | undefined): string => {
  if (!date) return '';
  return format(date, 'MMM').toUpperCase();
};

// Helper function to get acronym from activity name
const getActivityNameAcronym = (name: string): string => {
  if (!name) return '';
  
  // Split by spaces and get first letter of each word
  const words = name.trim().split(/\s+/);
  const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
  
  // Return up to first 3 characters
  return acronym.substring(0, 3);
};

export const useActivityForm = ({ data, onAddActivity }: UseActivityFormProps) => {
  // We don't need activityIdPrefix state anymore as we'll generate IDs dynamically
  const [activityIdPrefix, setActivityIdPrefix] = useState<string>('');
  
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

  // Generate activity ID whenever the activity name or go date changes
  useEffect(() => {
    updateActivityId();
  }, [selectedGoDate, newActivity.activityName]);

  // This function is kept for compatibility but doesn't do anything since prefix is generated dynamically
  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This is now a no-op as we generate IDs based on name and date
    console.log("Prefix changes are ignored as IDs are now auto-generated");
  };

  // Generate new activity ID based on activity name and go date
  const updateActivityId = () => {
    if (!selectedGoDate || !newActivity.activityName) {
      return; // Not enough information to generate ID
    }
    
    try {
      // Get acronym from activity name (first letters of each word)
      const nameAcronym = getActivityNameAcronym(newActivity.activityName);
      
      // Get 3-letter month abbreviation
      const monthAbbrev = getMonthAbbreviation(selectedGoDate);
      
      // Get day (2 digits)
      const day = format(selectedGoDate, 'dd');
      
      // Get year (last 2 digits)
      const year = format(selectedGoDate, 'yy');
      
      // Construct the new ID: [name acronym]-[month]-[day]-[year]
      const newId = `${nameAcronym}-${monthAbbrev}${day}-${year}`;
      console.log("Generated activity ID:", newId);
      
      // Update the activity ID
      setNewActivity(prev => ({
        ...prev,
        activityId: newId
      }));
      
      // Update prefix state for compatibility
      setActivityIdPrefix(nameAcronym);
    } catch (error) {
      console.error("Error generating activity ID:", error);
    }
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
      // Make sure we have an activity ID (should already be set, but just in case)
      if (!newActivity.activityId && selectedGoDate && newActivity.activityName) {
        const nameAcronym = getActivityNameAcronym(newActivity.activityName);
        const monthAbbrev = getMonthAbbreviation(selectedGoDate);
        const day = format(selectedGoDate, 'dd');
        const year = format(selectedGoDate, 'yy');
        const generatedId = `${nameAcronym}-${monthAbbrev}${day}-${year}`;
        
        newActivity.activityId = generatedId;
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

  // This is kept for compatibility but will return a placeholder value since we don't use sequence numbers anymore
  const getNextNumber = (prefix: string) => {
    return 1; // Placeholder, we don't use sequence numbers anymore
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
    getNextNumber,
    data
  };
};
