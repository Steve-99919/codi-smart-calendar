
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
      const formattedGoDate = format(date, 'dd/MM/yyyy');
      
      // Validate go date itself
      const isGoDateOnWeekend = isWeekend(formattedGoDate);
      const isGoDateOnHoliday = isPublicHoliday(formattedGoDate);
      
      if (isGoDateOnWeekend && !allowWeekends) {
        toast.error("You have selected a weekend date for go date. Please enable weekend dates in preferences or select another date.");
        setSelectedGoDate(undefined);
        return;
      }
      
      if (isGoDateOnHoliday && !allowHolidays) {
        toast.error("You have selected a public holiday for go date. Please enable holiday dates in preferences or select another date.");
        setSelectedGoDate(undefined);
        return;
      }
      
      // Calculate initial prep date (3 days before go date)
      const initialPrepDate = subDays(date, 3);
      const initialPrepDateFormatted = format(initialPrepDate, 'dd/MM/yyyy');
      
      // Check if the initial prep date needs adjustment
      const isPrepDateOnWeekend = isWeekend(initialPrepDateFormatted);
      const isPrepDateOnHoliday = isPublicHoliday(initialPrepDateFormatted);
      
      let finalPrepDate = initialPrepDate;
      let needsAdjustment = false;
      
      // If prep date falls on weekend/holiday and user doesn't allow them, adjust it
      if ((isPrepDateOnWeekend && !allowWeekends) || (isPrepDateOnHoliday && !allowHolidays)) {
        needsAdjustment = true;
        finalPrepDate = getPreviousBusinessDay(initialPrepDate, allowWeekends, allowHolidays);
      }
      
      const finalPrepDateFormatted = format(finalPrepDate, 'dd/MM/yyyy');
      
      // Show info message if we had to adjust the prep date
      if (needsAdjustment) {
        const reasonMessage = isPrepDateOnWeekend && !allowWeekends ? 'weekend' : 'holiday';
        toast.info(`Prep date automatically adjusted from ${initialPrepDateFormatted} to ${finalPrepDateFormatted} to avoid ${reasonMessage}`);
      }
      
      // Update the state with both dates
      setSelectedPrepDate(finalPrepDate);
      setNewActivity(prev => ({
        ...prev,
        goDate: formattedGoDate,
        prepDate: finalPrepDateFormatted
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
