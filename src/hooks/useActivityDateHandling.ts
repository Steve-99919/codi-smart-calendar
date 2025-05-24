
import { useState } from 'react';
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { getPreviousBusinessDay } from '@/utils/businessDayUtils';
import { CSVRow } from '@/types/csv';

interface UseActivityDateHandlingProps {
  allowWeekends: boolean;
  allowHolidays: boolean;
  setNewActivity: React.Dispatch<React.SetStateAction<CSVRow>>;
}

export const useActivityDateHandling = ({
  allowWeekends,
  allowHolidays,
  setNewActivity
}: UseActivityDateHandlingProps) => {
  const [selectedPrepDate, setSelectedPrepDate] = useState<Date>();
  const [selectedGoDate, setSelectedGoDate] = useState<Date>();

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
      
      // Always adjust prep date if user preferences don't allow weekends/holidays
      const adjustedPrepDate = (!allowWeekends || !allowHolidays) 
        ? getPreviousBusinessDay(initialPrepDate, allowWeekends, allowHolidays)
        : initialPrepDate;
      
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

  const resetDates = () => {
    setSelectedPrepDate(undefined);
    setSelectedGoDate(undefined);
  };

  return {
    selectedPrepDate,
    selectedGoDate,
    handlePrepDateSelect,
    handleGoDateSelect,
    resetDates
  };
};
