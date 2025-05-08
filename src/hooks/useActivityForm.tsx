
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { useActivitySettings } from './useActivitySettings';
import { useActivityFormState } from './useActivityFormState';
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { getNextNumber, parseActivityId, getNextAvailableNumber } from '@/services/activityDataService';
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

  // Update the prefix change handler to allow special characters
  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow more complex prefixes including dashes and underscores
    const newPrefix = e.target.value.replace(/[^A-Za-z0-9\-_]/g, '');
    setActivityIdPrefix(newPrefix || 'A');
    updateActivityId(newPrefix || 'A');
  };

  const updateActivityId = (prefix: string) => {
    // Use the next available sequential number (fills gaps)
    const nextNumber = getNextAvailableNumber(data, prefix);
    
    // Format the number with leading zeros, matching the pattern of existing IDs
    let formattedNumber = String(nextNumber);
    
    // Detect the digit count pattern from existing IDs with the same prefix
    const relevantIds = data
      .map(item => parseActivityId(item.activityId))
      .filter(parsed => parsed?.prefix === prefix);
    
    if (relevantIds.length > 0) {
      // Find the most common digit count
      const digitCounts: Record<number, number> = {};
      relevantIds.forEach(parsed => {
        if (parsed) {
          const digitCount = String(parsed.number).length;
          digitCounts[digitCount] = (digitCounts[digitCount] || 0) + 1;
        }
      });
      
      // Get the most common digit count
      const mostCommonDigitCount = Object.entries(digitCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      
      if (mostCommonDigitCount) {
        // Pad with leading zeros to match the most common digit count
        formattedNumber = String(nextNumber).padStart(Number(mostCommonDigitCount), '0');
      }
    }
    
    setNewActivity(prev => ({
      ...prev,
      activityId: `${prefix}${formattedNumber}`
    }));
  };
  
  const handleOpenAddActivity = () => {
    let defaultPrefix = 'A';

    if (data.length > 0) {
      const prefixCounts: Record<string, number> = {};

      // Extract prefixes using our improved regex parser
      data.forEach((row) => {
        const parsed = parseActivityId(row.activityId);
        if (parsed && parsed.prefix) {
          const prefix = parsed.prefix;
          prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
        }
      });

      // Sort by count to find most common prefix
      const sortedPrefixes = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1]);
      const mostCommonPrefix = sortedPrefixes[0]?.[0];
      
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
    getNextNumber: (prefix: string) => getNextAvailableNumber(data, prefix),
    data  // Now we're explicitly passing data through
  };
};
