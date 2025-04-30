
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { getNextNumber } from '@/services/activityDataService';
import { toast } from "sonner";

interface UseActivityFormSubmissionProps {
  data: CSVRow[];
  activityIdPrefix: string;
  newActivity: CSVRow;
  setNewActivity: React.Dispatch<React.SetStateAction<CSVRow>>;
  resetForm: () => void;
  setShowAddForm: (show: boolean) => void;
  validateForm: () => boolean;
}

export const useActivityFormSubmission = ({
  data,
  activityIdPrefix,
  newActivity,
  setNewActivity,
  resetForm,
  setShowAddForm,
  validateForm
}: UseActivityFormSubmissionProps) => {
  const [isProcessingActivity, setIsProcessingActivity] = useState(false);

  const updateActivityId = (prefix: string) => {
    const nextNumber = getNextNumber(data, prefix);
    setNewActivity(prev => ({
      ...prev,
      activityId: `${prefix}${nextNumber}`
    }));
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrefix = e.target.value.replace(/[^A-Za-z]/g, '');
    const finalPrefix = newPrefix || 'A'; // Ensure we always have at least one character
    updateActivityId(finalPrefix);
  };

  const handleOpenAddActivity = () => {
    const nextId = `${activityIdPrefix}${getNextNumber(data, activityIdPrefix)}`;
    setNewActivity(prev => ({
      ...prev,
      activityId: nextId
    }));
    return nextId;
  };

  const submitActivity = (onAddActivity: (newActivity: CSVRow) => void) => {
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

  const handleSubmit = (e: React.FormEvent, onAddActivity: (newActivity: CSVRow) => void) => {
    e.preventDefault();
    if (validateForm()) {
      submitActivity(onAddActivity);
    }
  };

  return {
    isProcessingActivity,
    handlePrefixChange,
    handleOpenAddActivity,
    handleSubmit
  };
};
