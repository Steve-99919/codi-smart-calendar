import { format } from "date-fns";
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';

export const getPreviousBusinessDay = (
  date: Date, 
  allowWeekends: boolean, 
  allowHolidays: boolean
): Date => {
  let adjustedDate = new Date(date);
  let dateStr = format(adjustedDate, 'dd/MM/yyyy');
  
  // Keep moving back until we find a valid business day
  while ((!allowWeekends && isWeekend(dateStr)) || (!allowHolidays && isPublicHoliday(dateStr))) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
    dateStr = format(adjustedDate, 'dd/MM/yyyy');
  }
  
  return adjustedDate;
};
