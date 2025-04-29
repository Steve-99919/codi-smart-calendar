
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { useActivitySettings } from './useActivitySettings';
import { useActivityFormState } from './useActivityFormState';
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { getNextNumber } from '@/services/activityDataService';
import { toast } from "sonner";

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
    resetForm
  } = useActivityFormState({
    data,
    activityIdPrefix,
    allowWeekends,
    allowHolidays
  });

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrefix = e.target.value.replace(/[^A-Za-z]/g, '');
    setActivityIdPrefix(newPrefix || 'A'); // Ensure we always have at least one character
    updateActivityId(newPrefix || 'A');
  };

  const updateActivityId = (prefix: string) => {
    const nextNumber = getNextNumber(data, prefix);
    setNewActivity(prev => ({
      ...prev,
      activityId: `${prefix}${nextNumber}`
    }));
  };
  
  const handleOpenAddActivity = () => {
    const nextId = `${activityIdPrefix}${getNextNumber(data, activityIdPrefix)}`;
    setNewActivity(prev => ({
      ...prev,
      activityId: nextId
    }));
    
    setShowPreferenceDialog(true);
  };

  const submitActivity = () => {
    if (isProcessingActivity) return;
    
    setIsProcessingActivity(true);
    
    try {
      if (!newActivity.activityId) {
        const nextId = `${activityIdPrefix}${getNextNumber(data, activityIdPrefix)}`;
        newActivity.activityId = nextId;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitActivity();
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
    getNextNumber
  };
};
