
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { isWeekend, isPublicHoliday, isValidDateFormat, getConflictingEvents } from '@/utils/dateUtils';
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
    const nextNumber = getNextNumber(newPrefix);
    setNewActivity(prev => ({
      ...prev,
      activityId: `${newPrefix}${nextNumber}`
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
    setShowPreferenceDialog(true);
  };

  const handleProceedToForm = () => {
    setShowPreferenceDialog(false);
    setShowAddForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name !== 'activityId') {
      setNewActivity({
        ...newActivity,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    if (!newActivity.activityId || !newActivity.activityName || 
        !newActivity.prepDate || !newActivity.goDate) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (!isValidDateFormat(newActivity.prepDate) || !isValidDateFormat(newActivity.goDate)) {
      toast.error("Please enter dates in dd/mm/yyyy format");
      return false;
    }

    if (!allowWeekends) {
      if (isWeekend(newActivity.prepDate)) {
        setConflictMessage(`Prep Date (${newActivity.prepDate}) falls on a weekend. Do you want to continue anyway?`);
        setShowConflictAlert(true);
        return false;
      }
      if (isWeekend(newActivity.goDate)) {
        setConflictMessage(`Go Date (${newActivity.goDate}) falls on a weekend. Do you want to continue anyway?`);
        setShowConflictAlert(true);
        return false;
      }
    }

    if (!allowHolidays) {
      if (isPublicHoliday(newActivity.prepDate)) {
        setConflictMessage(`Prep Date (${newActivity.prepDate}) falls on a public holiday. Do you want to continue anyway?`);
        setShowConflictAlert(true);
        return false;
      }
      if (isPublicHoliday(newActivity.goDate)) {
        setConflictMessage(`Go Date (${newActivity.goDate}) falls on a public holiday. Do you want to continue anyway?`);
        setShowConflictAlert(true);
        return false;
      }
    }

    const prepConflicts = getConflictingEvents(data, newActivity.prepDate, -1);
    if (prepConflicts.length > 0) {
      setConflictMessage(`Prep Date (${newActivity.prepDate}) conflicts with: ${prepConflicts.join(", ")}. Do you want to continue anyway?`);
      setShowConflictAlert(true);
      return false;
    }

    const goConflicts = getConflictingEvents(data, newActivity.goDate, -1);
    if (goConflicts.length > 0) {
      setConflictMessage(`Go Date (${newActivity.goDate}) conflicts with: ${goConflicts.join(", ")}. Do you want to continue anyway?`);
      setShowConflictAlert(true);
      return false;
    }

    return true;
  };

  const submitActivity = () => {
    const activityToAdd = {
      ...newActivity,
      isWeekend: isWeekend(newActivity.prepDate) || isWeekend(newActivity.goDate),
      isHoliday: isPublicHoliday(newActivity.prepDate) || isPublicHoliday(newActivity.goDate)
    };
    
    onAddActivity(activityToAdd);
    resetForm();
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
