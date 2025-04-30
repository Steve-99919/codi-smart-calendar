import { format } from "date-fns";
import { isValidDateFormat } from './formatters';
import { isWeekend, isPublicHoliday } from './weekendHoliday';

// Function to get a valid prep date (avoiding weekends/holidays based on preferences)
export const getValidPrepDate = (date: Date, allowWeekends: boolean, allowHolidays: boolean): Date => {
  let validDate = new Date(date);
  let dateStr = format(validDate, 'dd/MM/yyyy');
  let attempts = 0;
  const MAX_ATTEMPTS = 10; // Safety limit to prevent infinite loops
  
  while (((!allowWeekends && isWeekend(dateStr)) || 
         (!allowHolidays && isPublicHoliday(dateStr))) && 
         attempts < MAX_ATTEMPTS) {
    // If date falls on a weekend or holiday and they're not allowed, 
    // move back one more day
    validDate.setDate(validDate.getDate() - 1);
    dateStr = format(validDate, 'dd/MM/yyyy');
    attempts++;
  }
  
  return validDate;
};

// Add days to a date string in dd/mm/yyyy format
export const addDaysToDate = (dateStr: string, days: number): string => {
  if (!isValidDateFormat(dateStr)) {
    return dateStr;
  }
  
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  
  const newDay = date.getDate().toString().padStart(2, '0');
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  const newYear = date.getFullYear();
  
  return `${newDay}/${newMonth}/${newYear}`;
};

// Check if a date passes all preference filters
export const datePassesPreferences = (
  dateStr: string, 
  preferences: {
    excludeWeekends: boolean;
    excludePublicHolidays: boolean;
    blockedDates: Date[];
    blockedMonths: number[];
  }
): boolean => {
  if (!isValidDateFormat(dateStr)) {
    return false;
  }
  
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Check weekends
  if (preferences.excludeWeekends && isWeekend(dateStr)) {
    return false;
  }
  
  // Check public holidays
  if (preferences.excludePublicHolidays && isPublicHoliday(dateStr)) {
    return false;
  }
  
  // Check blocked dates
  for (const blockedDate of preferences.blockedDates) {
    if (
      blockedDate.getDate() === date.getDate() && 
      blockedDate.getMonth() === date.getMonth() &&
      blockedDate.getFullYear() === date.getFullYear()
    ) {
      return false;
    }
  }
  
  // Check blocked months
  if (preferences.blockedMonths.includes(date.getMonth())) {
    return false;
  }
  
  return true;
};

// Get a valid date based on preferences, starting from the given date and adding days
export const getNextValidDate = (
  startDateStr: string, 
  daysToAdd: number,
  preferences: {
    excludeWeekends: boolean;
    excludePublicHolidays: boolean;
    blockedDates: Date[];
    blockedMonths: number[];
  }
): string => {
  let candidateDate = addDaysToDate(startDateStr, daysToAdd);
  let safetyCounter = 0;
  
  // Keep adding days until we find a valid date
  while (!datePassesPreferences(candidateDate, preferences) && safetyCounter < 100) {
    candidateDate = addDaysToDate(candidateDate, 1);
    safetyCounter++;
  }
  
  return candidateDate;
};
