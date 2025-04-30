
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { isWeekend, isPublicHoliday, isValidDateFormat, getValidPrepDate } from '@/utils/dateUtils';
import { format, subDays } from "date-fns";
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
  const [autoPrepDate, setAutoPrepDate] = useState<boolean>(true);
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
  const [activityHistory, setActivityHistory] = useState<CSVRow[][]>([]);

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

  // Calculate prep date - always 3 days before go date regardless of weekend/holiday
  const calculatePrepDate = (goDate: Date): Date => {
    return subDays(goDate, 3);
  };

  // Check if the calculated prep date would fall on a weekend or holiday
  const isPrepDateRestricted = (prepDate: Date): boolean => {
    const formattedDate = format(prepDate, 'dd/MM/yyyy');
    const isDateOnWeekend = isWeekend(formattedDate);
    const isDateOnHoliday = isPublicHoliday(formattedDate);
    
    return (isDateOnWeekend && !allowWeekends) || (isDateOnHoliday && !allowHolidays);
  };

  const handlePrepDateSelect = (date: Date | undefined) => {
    // Only used if autoPrepDate is false - which should never happen now
    setSelectedPrepDate(date);
    if (date) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      setNewActivity(prev => ({
        ...prev,
        prepDate: formattedDate
      }));
    }
  };

  const handleGoDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedGoDate(undefined);
      setSelectedPrepDate(undefined);
      setNewActivity(prev => ({
        ...prev,
        goDate: "",
        prepDate: ""
      }));
      return;
    }

    // First, set the go date
    const formattedGoDate = format(date, 'dd/MM/yyyy');
    const isGoDateOnWeekend = isWeekend(formattedGoDate);
    const isGoDateOnHoliday = isPublicHoliday(formattedGoDate);
    
    // Check if the go date itself falls on weekend/holiday
    if ((isGoDateOnWeekend && !allowWeekends) || (isGoDateOnHoliday && !allowHolidays)) {
      toast.error("You have selected a weekend or holiday for the go date. Please select another date.");
      return;
    }
    
    // Calculate prep date (always 3 days before)
    const prepDate = calculatePrepDate(date);
    const formattedPrepDate = format(prepDate, 'dd/MM/yyyy');
    
    // If restrictions apply and the prep date falls on a weekend/holiday
    if (isPrepDateRestricted(prepDate)) {
      toast.error("The prep date (3 days before) would fall on a weekend or holiday. Please select another go date.");
      return;
    }
    
    // All checks passed, update the form
    setSelectedGoDate(date);
    setSelectedPrepDate(prepDate);
    setNewActivity(prev => ({
      ...prev,
      goDate: formattedGoDate,
      prepDate: formattedPrepDate
    }));
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
    autoPrepDate: true, // Always set to true - we're enforcing this behavior
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
