
import { useState } from 'react';
import { format, subDays } from "date-fns";
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { toast } from "sonner";
import { CSVRow } from '@/types/csv';

interface UseActivityFormDatesProps {
  allowWeekends: boolean;
  allowHolidays: boolean;
  setNewActivity: React.Dispatch<React.SetStateAction<CSVRow>>;
}

export const useActivityFormDates = ({
  allowWeekends,
  allowHolidays,
  setNewActivity
}: UseActivityFormDatesProps) => {
  const [selectedPrepDate, setSelectedPrepDate] = useState<Date>();
  const [selectedGoDate, setSelectedGoDate] = useState<Date>();

  const calculatePrepDate = (goDate: Date): Date => {
    return subDays(goDate, 3);
  };

  const isPrepDateRestricted = (prepDate: Date): boolean => {
    const formattedDate = format(prepDate, 'dd/MM/yyyy');
    const isDateOnWeekend = isWeekend(formattedDate);
    const isDateOnHoliday = isPublicHoliday(formattedDate);
    
    return (isDateOnWeekend && !allowWeekends) || (isDateOnHoliday && !allowHolidays);
  };

  const handlePrepDateSelect = (date: Date | undefined) => {
    setSelectedPrepDate(date);
    if (date) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      setNewActivity(prev => ({
        ...prev,
        prepDate: formattedDate
      }));
    } else {
      setNewActivity(prev => ({
        ...prev,
        prepDate: ""
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
    
    // If restrictions apply and the prep date falls on a weekend/holiday
    if (isPrepDateRestricted(prepDate)) {
      toast.error("The prep date (3 days before) would fall on a weekend or holiday. Please select another go date.");
      return;
    }
    
    const formattedPrepDate = format(prepDate, 'dd/MM/yyyy');
    
    // All checks passed, update the form
    setSelectedGoDate(date);
    setSelectedPrepDate(prepDate);
    setNewActivity(prev => ({
      ...prev,
      goDate: formattedGoDate,
      prepDate: formattedPrepDate
    }));
  };

  return {
    selectedPrepDate,
    selectedGoDate,
    handlePrepDateSelect,
    handleGoDateSelect
  };
};
