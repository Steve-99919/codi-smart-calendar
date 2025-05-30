// Function to check if a date is a weekend
import { format } from "date-fns";

export const isWeekend = (dateStr: string): boolean => {
  // Parse the date in dd/mm/yyyy format
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  // 0 is Sunday, 6 is Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// Australian public holidays grouped by national and state-specific
interface HolidayMap {
  [key: string]: {
    name: string;
    states: string[];
  };
}

// Comprehensive list of Australian public holidays for 2024-2025
const australianHolidays: HolidayMap = {
  // 2024 National Holidays
  "01/01/2024": { name: "New Year's Day", states: ["ALL"] },
  "26/01/2024": { name: "Australia Day", states: ["ALL"] },
  "29/03/2024": { name: "Good Friday", states: ["ALL"] },
  "30/03/2024": { name: "Easter Saturday", states: ["ACT", "NSW", "QLD", "SA", "VIC", "NT"] },
  "31/03/2024": { name: "Easter Sunday", states: ["ACT", "NSW", "QLD", "VIC"] },
  "01/04/2024": { name: "Easter Monday", states: ["ALL"] },
  "25/04/2024": { name: "Anzac Day", states: ["ALL"] },
  "10/06/2024": { name: "King's Birthday", states: ["ACT", "NSW", "NT", "SA", "TAS", "VIC"] },
  "07/10/2024": { name: "Labour Day", states: ["ACT", "NSW", "SA"] },
  "25/12/2024": { name: "Christmas Day", states: ["ALL"] },
  "26/12/2024": { name: "Boxing Day", states: ["ALL"] },
  
  // 2024 State Specific Holidays
  "11/03/2024": { name: "Labour Day", states: ["VIC"] },
  "04/03/2024": { name: "Labour Day", states: ["WA"] },
  "06/05/2024": { name: "May Day", states: ["NT"] },
  "06/05/2024-QLD": { name: "Labour Day", states: ["QLD"] }, // Added suffix to avoid duplicate key
  "03/06/2024": { name: "Western Australia Day", states: ["WA"] },
  "30/09/2024": { name: "King's Birthday", states: ["WA"] },
  "07/10/2024-QLD": { name: "King's Birthday", states: ["QLD"] }, // Added suffix to avoid duplicate key
  "05/11/2024": { name: "Melbourne Cup", states: ["VIC"] },
  
  // 2025 National Holidays
  "01/01/2025": { name: "New Year's Day", states: ["ALL"] },
  "26/01/2025": { name: "Australia Day", states: ["ALL"] },
  "27/01/2025": { name: "Australia Day Observed", states: ["ALL"] },
  "18/04/2025": { name: "Good Friday", states: ["ALL"] },
  "19/04/2025": { name: "Easter Saturday", states: ["ACT", "NSW", "QLD", "SA", "VIC", "NT"] },
  "20/04/2025": { name: "Easter Sunday", states: ["ACT", "NSW", "QLD", "VIC"] },
  "21/04/2025": { name: "Easter Monday", states: ["ALL"] },
  "25/04/2025": { name: "Anzac Day", states: ["ALL"] },
  "09/06/2025": { name: "King's Birthday", states: ["ACT", "NSW", "NT", "SA", "TAS", "VIC"] },
  "06/10/2025-ACT": { name: "Labour Day", states: ["ACT", "NSW", "SA"] }, // Added suffix to avoid duplicate key
  "25/12/2025": { name: "Christmas Day", states: ["ALL"] },
  "26/12/2025": { name: "Boxing Day", states: ["ALL"] },
  
  // 2025 State Specific Holidays
  "10/03/2025": { name: "Labour Day", states: ["VIC"] },
  "03/03/2025": { name: "Labour Day", states: ["WA"] },
  "05/05/2025": { name: "May Day", states: ["NT"] },
  "05/05/2025-QLD": { name: "Labour Day", states: ["QLD"] }, // Added suffix to avoid duplicate key
  "02/06/2025": { name: "Western Australia Day", states: ["WA"] },
  "29/09/2025": { name: "King's Birthday", states: ["WA"] },
  "06/10/2025-QLD": { name: "King's Birthday", states: ["QLD"] }, // Added suffix to avoid duplicate key
  "04/11/2025": { name: "Melbourne Cup", states: ["VIC"] }
};

export const isPublicHoliday = (dateStr: string, state: string = "ALL"): boolean => {
  if (!dateStr || !dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return false;
  }
  
  // Check for normal date entry
  const holiday = australianHolidays[dateStr];
  if (holiday && (holiday.states.includes("ALL") || holiday.states.includes(state))) {
    return true;
  }
  
  // Check for suffixed entries (for dates that would be duplicates)
  const dateWithSuffixes = Object.keys(australianHolidays).filter(key => 
    key.startsWith(dateStr)
  );
  
  for (const key of dateWithSuffixes) {
    const holiday = australianHolidays[key];
    if (holiday && (holiday.states.includes("ALL") || holiday.states.includes(state))) {
      return true;
    }
  }
  
  return false;
};

export const getHolidayInfo = (dateStr: string): { isHoliday: boolean; name?: string; states?: string[] } => {
  if (!dateStr || !dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return { isHoliday: false };
  }
  
  // Check for normal date entry
  const holiday = australianHolidays[dateStr];
  if (holiday) {
    return {
      isHoliday: true,
      name: holiday.name,
      states: holiday.states
    };
  }
  
  // Check for suffixed entries (for dates that would be duplicates)
  const dateWithSuffixes = Object.keys(australianHolidays).filter(key => 
    key.startsWith(dateStr)
  );
  
  for (const key of dateWithSuffixes) {
    const holiday = australianHolidays[key];
    if (holiday) {
      return {
        isHoliday: true,
        name: holiday.name,
        states: holiday.states
      };
    }
  }
  
  return { isHoliday: false };
};

export const isValidDateFormat = (dateStr: string): boolean => {
  // Check if date matches dd/mm/yyyy format
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(dateStr)) {
    return false;
  }
  
  // Check if date is valid
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year;
};

export const formatDate = (dateStr: string): string => {
  // Ensure the date is in the correct format
  if (isValidDateFormat(dateStr)) {
    return dateStr;
  }

  // Handle common cases of day or month single digits without leading zeros, e.g. 8/04/2025 or 08/4/2025
  const parts = dateStr.split(/[\/\-\.]/);
  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;

  if (parts.length === 3) {
    // Try parsing as dd/mm/yyyy or d/m/yyyy (most common)
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    // If p0 > 12 => treat as day first, else could be ambiguous
    if (p0 > 12) {
      day = p0;
      month = p1;
      year = p2;
    } else if (p1 > 12) {
      // Unlikely, but if second part > 12 treat second as day and first as month (US style)
      day = p1;
      month = p0;
      year = p2;
    } else {
      // When both <= 12, assume dd/mm/yyyy as default (since this is Australian format)
      day = p0;
      month = p1;
      year = p2;
    }

    if (
      day && month && year &&
      year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31
    ) {
      // Validate date sanity
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        const dd = day.toString().padStart(2, '0');
        const mm = month.toString().padStart(2, '0');
        return `${dd}/${mm}/${year}`;
      }
    }
  }

  // Try fallback parsing with Date constructor as last resort
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if parsing failed
    }

    const dayFinal = date.getDate().toString().padStart(2, '0');
    const monthFinal = (date.getMonth() + 1).toString().padStart(2, '0');
    const yearFinal = date.getFullYear();

    return `${dayFinal}/${monthFinal}/${yearFinal}`;
  } catch (e) {
    return dateStr; // Return original if conversion failed
  }
};

// Function to check if first date is before second date
export const isDateBefore = (firstDate: string, secondDate: string): boolean => {
  if (!isValidDateFormat(firstDate) || !isValidDateFormat(secondDate)) {
    return true; // Skip validation if dates are not valid yet
  }
  
  const [day1, month1, year1] = firstDate.split('/').map(Number);
  const [day2, month2, year2] = secondDate.split('/').map(Number);
  
  const date1 = new Date(year1, month1 - 1, day1);
  const date2 = new Date(year2, month2 - 1, day2);
  
  return date1 < date2;
};

// New function to check for date conflicts across events
export const findDateConflicts = (data: any[], dateToCheck: string, currentIndex: number): boolean => {
  if (!dateToCheck || !isValidDateFormat(dateToCheck)) {
    return false;
  }
  
  return data.some((item, index) => {
    // Skip comparing with itself
    if (index === currentIndex) {
      return false;
    }
    
    // Check for conflicts with both prepDate and goDate
    return (item.prepDate === dateToCheck || item.goDate === dateToCheck);
  });
};

// New function to get conflicting event names
export const getConflictingEvents = (data: any[], dateToCheck: string, currentIndex: number): string[] => {
  if (!dateToCheck || !isValidDateFormat(dateToCheck)) {
    return [];
  }
  
  return data
    .filter((item, index) => {
      if (index === currentIndex) return false;
      return (item.prepDate === dateToCheck || item.goDate === dateToCheck);
    })
    .map(item => item.activityName);
};

// Check if any dates in the data have conflicts or invalid date sequences
export const hasAnyConflicts = (data: any[]): boolean => {
  return data.some((row, index) => {
    return findDateConflicts(data, row.prepDate, index) || 
           findDateConflicts(data, row.goDate, index) ||
           !isDateBefore(row.prepDate, row.goDate);
  });
};

// NEW FUNCTIONS FOR RESCHEDULING

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

// Function to check if a date is already used in another activity
export const hasDateConflict = (
  data: any[], 
  dateToCheck: string, 
  currentActivityId?: string
): { hasConflict: boolean; conflictingActivities: string[] } => {
  if (!dateToCheck || !isValidDateFormat(dateToCheck)) {
    return { hasConflict: false, conflictingActivities: [] };
  }
  
  const conflicts = data.filter(activity => {
    // Skip comparing with itself if updating existing activity
    if (currentActivityId && activity.activityId === currentActivityId) {
      return false;
    }
    return activity.prepDate === dateToCheck || activity.goDate === dateToCheck;
  });

  return {
    hasConflict: conflicts.length > 0,
    conflictingActivities: conflicts.map(activity => activity.activityName)
  };
};

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
