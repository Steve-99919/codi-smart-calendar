
import { isValidDateFormat, isWeekend, isPublicHoliday } from '@/utils/dateUtils';
import { toast } from 'sonner';
import { CSVRow } from '@/types/csv';

interface UseActivityFormValidationProps {
  newActivity: CSVRow;
  allowWeekends: boolean;
  allowHolidays: boolean;
}

export const useActivityFormValidation = ({
  newActivity,
  allowWeekends,
  allowHolidays
}: UseActivityFormValidationProps) => {
  
  const validateForm = (): boolean => {
    if (!newActivity.activityName || 
        !newActivity.prepDate || !newActivity.goDate) {
      toast.error("Please fill in all required fields");
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

  return { validateForm };
};
