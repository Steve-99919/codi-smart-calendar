
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { useActivitySettings } from './useActivitySettings';
import { useActivityFormState } from './activityForm/useActivityFormState';
import { useActivityFormSubmission } from './activityForm/useActivityFormSubmission';
import { getNextNumber } from '@/services/activityDataService';

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
    handleProceedToForm
  } = useActivitySettings();
  
  const {
    selectedPrepDate,
    selectedGoDate,
    newActivity,
    setNewActivity,
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

  const {
    handlePrefixChange,
    handleSubmit: submitHandler
  } = useActivityFormSubmission({
    data,
    activityIdPrefix,
    newActivity,
    setNewActivity,
    resetForm,
    setShowAddForm,
    validateForm
  });

  // Fix: removed the duplicate handleOpenAddActivity from useActivityFormSubmission
  const handleOpenAddActivity = () => {
    const nextId = `${activityIdPrefix}${getNextNumber(data, activityIdPrefix)}`;
    setNewActivity(prev => ({
      ...prev,
      activityId: nextId
    }));
    
    setShowPreferenceDialog(true);
    return nextId;
  };

  const handleSubmit = (e: React.FormEvent) => {
    submitHandler(e, onAddActivity);
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
    autoPrepDate: true  // Add the autoPrepDate property that was missing
  };
};
