import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { isWeekend, isPublicHoliday, isValidDateFormat, getValidPrepDate } from '@/utils/dateUtils';
import { getNextNumber } from '@/services/activityDataService';

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
  const [selectedPrepDate, setSelectedPrepDate] = useState<Date>();
  const [selectedGoDate, setSelectedGoDate] = useState<Date>();
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

  // Function to find the previous business day
  const getPreviousBusinessDay = (date: Date): Date => {
    let adjustedDate = new Date(date);
    let dateStr = format(adjustedDate, 'dd/MM/yyyy');
    
    // Keep moving back until we find a valid business day
    while ((!allowWeekends && isWeekend(dateStr)) || (!allowHolidays && isPublicHoliday(dateStr))) {
      adjustedDate.setDate(adjustedDate.getDate() - 1);
      dateStr = format(adjustedDate, 'dd/MM/yyyy');
    }
    
    return adjustedDate;
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
      
      // Calculate prep date (3 days before go date)
      const initialPrepDate = subDays(date, 3);
      
      // Check if the initial prep date falls on weekend/holiday and adjust if needed
      const adjustedPrepDate = getPreviousBusinessDay(initialPrepDate);
      const prepDateFormatted = format(adjustedPrepDate, 'dd/MM/yyyy');
      
      // If we had to adjust the date, show an info message
      const originalPrepDateFormatted = format(initialPrepDate, 'dd/MM/yyyy');
      if (originalPrepDateFormatted !== prepDateFormatted) {
        toast.info(`Prep date automatically adjusted from ${originalPrepDateFormatted} to ${prepDateFormatted} to avoid weekend/holiday`);
      }
      
      setSelectedPrepDate(adjustedPrepDate);
      setNewActivity(prev => ({
        ...prev,
        goDate: formattedDate,
        prepDate: prepDateFormatted
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!newActivity.activityName || 
        !newActivity.prepDate || !newActivity.goDate) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (!newActivity.activityId) {
      toast.error("Please generate an activity ID before submitting");
      return false;
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
    setSelectedPrepDate(undefined);
    setSelectedGoDate(undefined);
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
    validateForm,
    resetForm,
    setNewActivity
  };
};
