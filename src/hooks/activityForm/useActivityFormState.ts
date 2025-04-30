
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { getNextNumber } from '@/services/activityDataService';
import { useActivityFormValidation } from './useActivityFormValidation';
import { useActivityFormDates } from './useActivityFormDates';

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
    activityId: `${activityIdPrefix}${getNextNumber(data, activityIdPrefix)}`,
    activityName: "",
    description: "",
    strategy: "",
    prepDate: "",
    goDate: "",
    isWeekend: false,
    isHoliday: false
  });

  const { validateForm } = useActivityFormValidation({
    newActivity,
    allowWeekends,
    allowHolidays
  });

  const { 
    selectedPrepDate,
    selectedGoDate,
    handlePrepDateSelect,
    handleGoDateSelect
  } = useActivityFormDates({
    allowWeekends,
    allowHolidays,
    setNewActivity
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity({
      ...newActivity,
      [name]: value
    });
  };

  const resetForm = () => {
    setNewActivity({
      activityId: `${activityIdPrefix}${getNextNumber(data, activityIdPrefix)}`,
      activityName: "",
      description: "",
      strategy: "",
      prepDate: "",
      goDate: "",
      isWeekend: false,
      isHoliday: false
    });
    setSelectedPrepDate(undefined);
    setSelectedGoDate(undefined);
  };

  return {
    selectedPrepDate,
    selectedGoDate,
    newActivity,
    setNewActivity,
    isProcessingActivity,
    setIsProcessingActivity,
    handlePrepDateSelect,
    handleGoDateSelect,
    handleInputChange,
    validateForm,
    resetForm
  };
};
