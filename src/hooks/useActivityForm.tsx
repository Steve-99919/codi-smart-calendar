
import { useState, useEffect } from 'react';
import { CSVRow } from '@/types/csv';
import { useActivitySettings } from './useActivitySettings';
import { useActivityFormState } from './useActivityFormState';
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { toast } from "sonner";
import { format } from "date-fns";

interface UseActivityFormProps {
  data: CSVRow[];
  onAddActivity: (newActivity: CSVRow) => void;
}

export const useActivityForm = ({ data, onAddActivity }: UseActivityFormProps) => {
  // We don't need activityIdPrefix state anymore as we'll generate IDs manually
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
    generateActivityId,
    validateForm,
    resetForm,
    setNewActivity
  } = useActivityFormState({
    data,
    activityIdPrefix,
    allowWeekends,
    allowHolidays
  });

  // This function is kept for compatibility but doesn't do anything
  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This is now a no-op as we generate IDs manually
    console.log("Prefix changes are ignored as IDs are now generated manually");
  };

  const handleOpenAddActivity = () => {
    console.log("Opening Add Activity dialog");
    resetForm(); // Ensure we start fresh
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
      // Make sure we have an activity ID
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
    generateActivityId
  };
};
