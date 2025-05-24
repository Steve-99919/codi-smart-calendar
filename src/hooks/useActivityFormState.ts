
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { useActivityDateHandling } from './useActivityDateHandling';
import { useActivityFormValidation } from './useActivityFormValidation';

interface UseActivityFormStateProps {
  data: CSVRow[];
  activityIdPrefix: string;
  allowWeekends: boolean;
  allowHolidays: boolean;
}

export const useActivityFormState = ({
  data,
  activityIdPrefix,
  allowWeekends,
  allowHolidays
}: UseActivityFormStateProps) => {
  const [isProcessingActivity, setIsProcessingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<CSVRow>({
    activityId: "", // Start with empty activityId
    activityName: "",
    description: "",
    strategy: "",
    prepDate: "",
    goDate: "",
    isWeekend: false,
    isHoliday: false
  });

  const {
    selectedPrepDate,
    selectedGoDate,
    handlePrepDateSelect,
    handleGoDateSelect,
    resetDates
  } = useActivityDateHandling({
    allowWeekends,
    allowHolidays,
    setNewActivity
  });

  const { validateForm } = useActivityFormValidation({
    allowWeekends,
    allowHolidays
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setNewActivity({
      activityId: "", // Reset to empty
      activityName: "",
      description: "",
      strategy: "",
      prepDate: "",
      goDate: "",
      isWeekend: false,
      isHoliday: false
    });
    resetDates();
  };

  return {
    selectedPrepDate,
    selectedGoDate,
    newActivity,
    isProcessingActivity,
    setIsProcessingActivity,
    handlePrepDateSelect,
    handleGoDateSelect,
    handleInputChange,
    validateForm: () => validateForm(newActivity),
    resetForm,
    setNewActivity
  };
};
