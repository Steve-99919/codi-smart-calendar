
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { isWeekend, isPublicHoliday, isValidDateFormat } from '@/utils/dateUtils';
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
    setActivityIdPrefix(newPrefix || 'A'); // Ensure we always have at least one character
    updateActivityId(newPrefix || 'A');
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
      const formattedDate = format(date, 'dd/MM/yyyy');
      const isDateOnWeekend = isWeekend(formattedDate);
      const isDateOnHoliday = isPublicHoliday(formattedDate);
      
      if (isDateOnWeekend && !allowWeekends) {
        toast.error("You have selected a weekend date. Please enable weekend dates in preferences or select another date.");
        setSelectedPrepDate(undefined);
        return;
      }
      
      if (isDateOnHoliday && !allowHolidays) {
        toast.error("You have selected a public holiday. Please enable holiday dates in preferences or select another date.");
        setSelectedPrepDate(undefined);
        return;
      }
      
      setNewActivity(prev => ({
        ...prev,
        prepDate: formattedDate
      }));
    }
  };

  const handleGoDateSelect = (date: Date | undefined) => {
    setSelectedGoDate(date);
    if (date) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      const isDateOnWeekend = isWeekend(formattedDate);
      const isDateOnHoliday = isPublicHoliday(formattedDate);
      
      if (isDateOnWeekend && !allowWeekends) {
        toast.error("You have selected a weekend date. Please enable weekend dates in preferences or select another date.");
        setSelectedGoDate(undefined);
        return;
      }
      
      if (isDateOnHoliday && !allowHolidays) {
        toast.error("You have selected a public holiday. Please enable holiday dates in preferences or select another date.");
        setSelectedGoDate(undefined);
        return;
      }
      
      setNewActivity(prev => ({
        ...prev,
        goDate: formattedDate
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

    // Validate weekend and holiday restrictions
    const isPrepWeekend = isWeekend(newActivity.prepDate);
    const isGoWeekend = isWeekend(newActivity.goDate);
    const isPrepHoliday = isPublicHoliday(newActivity.prepDate);
    const isGoHoliday = isPublicHoliday(newActivity.goDate);

    if ((isPrepWeekend || isGoWeekend) && !allowWeekends) {
      toast.error("One or more selected dates fall on a weekend. Please enable weekend dates in preferences or select different dates.");
      return false;
    }

    if ((isPrepHoliday || isGoHoliday) && !allowHolidays) {
      toast.error("One or more selected dates fall on a public holiday. Please enable holiday dates in preferences or select different dates.");
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
