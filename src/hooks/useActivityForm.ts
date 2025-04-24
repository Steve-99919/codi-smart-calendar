import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { isWeekend, isPublicHoliday, isValidDateFormat, hasDateConflict } from '@/utils/dateUtils';
import { format } from "date-fns";
import { toast } from "sonner";

interface UseActivityFormProps {
  data: CSVRow[];
  onAddActivity: (newActivity: CSVRow) => void;
}

export const useActivityForm = ({ data, onAddActivity }: UseActivityFormProps) => {
  const [showPreferenceDialog, setShowPreferenceDialog] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [allowWeekends, setAllowWeekends] = useState(false);
  const [allowHolidays, setAllowHolidays] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [selectedPrepDate, setSelectedPrepDate] = useState<Date>();
  const [selectedGoDate, setSelectedGoDate] = useState<Date>();
  const [activityIdPrefix, setActivityIdPrefix] = useState<string>('A');
  const [newActivity, setNewActivity] = useState<CSVRow>({
    activityId: "",
    activityName: "",
    description: "",
    strategy: "",
    prepDate: "",
    goDate: "",
    isWeekend: false,
    isHoliday: false
  });
  const [isProcessingActivity, setIsProcessingActivity] = useState(false);

  const parseActivityId = (id: string) => {
    const match = id.match(/([A-Za-z]+)(\d+)/);
    return match ? { prefix: match[1], number: parseInt(match[2]) } : null;
  };

  const getNextNumber = (prefix: string) => {
    const relevantIds = data
      .map(item => parseActivityId(item.activityId))
      .filter(parsed => parsed?.prefix === prefix);
    
    if (relevantIds.length === 0) return 1;
    
    const maxNumber = Math.max(...relevantIds.map(parsed => parsed?.number || 0));
    return maxNumber + 1;
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrefix = e.target.value.replace(/[^A-Za-z]/g, '');
    setActivityIdPrefix(newPrefix);
    updateActivityId(newPrefix);
  };

  const updateActivityId = (prefix: string) => {
    const nextNumber = getNextNumber(prefix);
    setNewActivity(prev => ({
      ...prev,
      activityId: `${prefix}${nextNumber}`
    }));
  };

  const handlePrepDateSelect = (date: Date | undefined) => {
    setSelectedPrepDate(date);
    if (date) {
      setNewActivity(prev => ({
        ...prev,
        prepDate: format(date, 'dd/MM/yyyy')
      }));
    }
  };

  const handleGoDateSelect = (date: Date | undefined) => {
    setSelectedGoDate(date);
    if (date) {
      setNewActivity(prev => ({
        ...prev,
        goDate: format(date, 'dd/MM/yyyy')
      }));
    }
  };

  const handleOpenAddActivity = () => {
    const nextId = `${activityIdPrefix}${getNextNumber(activityIdPrefix)}`;
    setNewActivity(prev => ({
      ...prev,
      activityId: nextId
    }));
    
    setShowPreferenceDialog(true);
  };

  const handleProceedToForm = () => {
    setShowPreferenceDialog(false);
    setShowAddForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name !== 'activityIdPrefix') {
      setNewActivity({
        ...newActivity,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    if (!newActivity.activityName || 
        !newActivity.prepDate || !newActivity.goDate) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (!newActivity.activityId) {
      const nextId = `${activityIdPrefix}${getNextNumber(activityIdPrefix)}`;
      setNewActivity(prev => ({
        ...prev,
        activityId: nextId
      }));
    }

    if (!isValidDateFormat(newActivity.prepDate) || !isValidDateFormat(newActivity.goDate)) {
      toast.error("Please enter dates in dd/mm/yyyy format");
      return false;
    }

    const prepDateCheck = hasDateConflict(data, newActivity.prepDate);
    if (prepDateCheck.hasConflict) {
      setConflictMessage(
        `Prep Date (${newActivity.prepDate}) conflicts with: ${prepDateCheck.conflictingActivities.join(", ")}. Do you want to continue anyway?`
      );
      setShowConflictAlert(true);
      return false;
    }

    const goDateCheck = hasDateConflict(data, newActivity.goDate);
    if (goDateCheck.hasConflict) {
      setConflictMessage(
        `Go Date (${newActivity.goDate}) conflicts with: ${goDateCheck.conflictingActivities.join(", ")}. Do you want to continue anyway?`
      );
      setShowConflictAlert(true);
      return false;
    }

    return true;
  };

  const submitActivity = () => {
    if (isProcessingActivity) return;
    
    setIsProcessingActivity(true);
    
    try {
      if (!newActivity.activityId) {
        const nextId = `${activityIdPrefix}${getNextNumber(activityIdPrefix)}`;
        newActivity.activityId = nextId;
      }
      
      const activityToAdd = {
        ...newActivity,
        isWeekend: isWeekend(newActivity.prepDate) || isWeekend(newActivity.goDate),
        isHoliday: isPublicHoliday(newActivity.prepDate) || isPublicHoliday(newActivity.goDate)
      };
      
      onAddActivity(activityToAdd);
      resetForm();
      
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

  const handleContinueAnyway = () => {
    setShowConflictAlert(false);
    setTimeout(() => {
      submitActivity();
    }, 300);
  };

  const resetForm = () => {
    setNewActivity({
      activityId: "",
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
    setShowAddForm(false);
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
    showConflictAlert,
    setShowConflictAlert,
    conflictMessage,
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
    handleContinueAnyway,
    getNextNumber
  };
};
