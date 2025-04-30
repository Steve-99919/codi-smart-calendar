
import { isValidDateFormat } from './formatters';
import { isWeekend, isPublicHoliday } from './weekendHoliday';

// Compare dates
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

// Date conflict management
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

export const hasAnyConflicts = (data: any[]): boolean => {
  return data.some((row, index) => {
    return findDateConflicts(data, row.prepDate, index) || 
           findDateConflicts(data, row.goDate, index) ||
           !isDateBefore(row.prepDate, row.goDate);
  });
};

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
