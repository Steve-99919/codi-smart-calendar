
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { useActivitySettings } from './useActivitySettings';
import { useActivityFormState } from './useActivityFormState';
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { getNextNumber, parseActivityId } from '@/services/activityDataService';
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
    resetForm,
    setNewActivity
  } = useActivityFormState({
    data,
    activityIdPrefix,
    allowWeekends,
    allowHolidays
  });

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow more complex prefixes - don't strip out non-letter characters
    const newPrefix = e.target.value;
    setActivityIdPrefix(newPrefix || 'A');
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
    let defaultPrefix = 'A';

    if (data.length > 0) {
      const prefixCounts: Record<string, number> = {};

      data.forEach((row) => {
        const match = row.activityId.match(/^([A-Za-z]+)/); // extract leading letters
        if (match) {
          const prefix = match[1];
          prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
        }
      });

      const mostCommonPrefix = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (mostCommonPrefix) {
        defaultPrefix = mostCommonPrefix;
      }
    }

    setActivityIdPrefix(defaultPrefix);
    updateActivityId(defaultPrefix);
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
    getNextNumber: (prefix: string) => getNextNumber(data, prefix),
    data  // Now we're explicitly passing data through
  };
};
