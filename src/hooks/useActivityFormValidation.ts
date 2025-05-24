
import { toast } from "sonner";
import { isWeekend, isPublicHoliday, isValidDateFormat } from '@/utils/dateUtils';
import { CSVRow } from '@/types/csv';

interface UseActivityFormValidationProps {
  allowWeekends: boolean;
  allowHolidays: boolean;
}

export const useActivityFormValidation = ({
  allowWeekends,
  allowHolidays
}: UseActivityFormValidationProps) => {
  
  const validateForm = (newActivity: CSVRow) => {
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

    // Only validate go date restrictions - prep date is automatically adjusted
    const isGoWeekend = isWeekend(newActivity.goDate);
    const isGoHoliday = isPublicHoliday(newActivity.goDate);

    if (isGoWeekend && !allowWeekends) {
      toast.error("Go date falls on a weekend. Please enable weekend dates in preferences or select a different date.");
      return false;
    }

    if (isGoHoliday && !allowHolidays) {
      toast.error("Go date falls on a public holiday. Please enable holiday dates in preferences or select a different date.");
      return false;
    }

    // Note: We don't validate prep date restrictions here because it's automatically adjusted
    return true;
  };

  return {
    validateForm
  };
};
