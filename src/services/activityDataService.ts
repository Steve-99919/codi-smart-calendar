
import { CSVRow } from '@/types/csv';
import { isDateBefore } from '@/utils/dateUtils';

// Parse activity ID to extract prefix and number parts using improved regex
export const parseActivityId = (id: string) => {
  // This pattern will match any sequence of letters, numbers, dashes, and underscores
  // followed by a series of digits at the end
  console.log("Parsing activity ID:", id);
  const match = id.match(/^([A-Za-z0-9\-_]+?)(\d+)$/);
  console.log("Match result:", match ? { prefix: match[1], number: parseInt(match[2]) } : null);
  return match ? { prefix: match[1], number: parseInt(match[2]) } : null;
};

// Get the next sequential number for a given prefix
export const getNextNumber = (data: CSVRow[], prefix: string) => {
  // Filter for IDs that have the same prefix pattern
  const relevantIds = data
    .map(item => parseActivityId(item.activityId))
    .filter(parsed => parsed?.prefix === prefix);
  
  if (relevantIds.length === 0) return 1;
  
  // Find the highest number used with this prefix
  const maxNumber = Math.max(...relevantIds.map(parsed => parsed?.number || 0));
  return maxNumber + 1;
};

// Get the first available number for a given prefix (filling gaps)
export const getNextAvailableNumber = (data: CSVRow[], prefix: string) => {
  // Filter for IDs that have the same prefix pattern
  const relevantIds = data
    .map(item => parseActivityId(item.activityId))
    .filter(parsed => parsed?.prefix === prefix);
  
  if (relevantIds.length === 0) return 1;
  
  // Get all numbers used with this prefix
  const usedNumbers = relevantIds.map(parsed => parsed?.number || 0).sort((a, b) => a - b);
  
  // Find the first gap in the sequence or return max+1
  let nextNumber = 1;
  for (let i = 0; i < usedNumbers.length; i++) {
    if (usedNumbers[i] !== nextNumber) {
      return nextNumber;
    }
    nextNumber++;
  }
  
  return nextNumber;
};

// Add a new activity while preserving existing IDs
export const addActivity = (data: CSVRow[], newActivity: CSVRow): CSVRow[] => {
  const newData = [...data];
  
  // Find insertion point based on date order
  const insertIndex = newData.findIndex(
    item => !isDateBefore(item.prepDate, newActivity.prepDate)
  );
  
  // Insert at the correct position based on date
  if (insertIndex >= 0) {
    newData.splice(insertIndex, 0, newActivity);
  } else {
    newData.push(newActivity);
  }
  
  return newData;
};

// Update an activity while preserving IDs
export const updateActivity = (data: CSVRow[], index: number, updatedRow: CSVRow): CSVRow[] => {
  const newData = [...data];
  newData.splice(index, 1);
  
  // Find insertion point based on date order
  const insertIndex = newData.findIndex(
    item => !isDateBefore(item.prepDate, updatedRow.prepDate)
  );
  
  if (insertIndex >= 0) {
    newData.splice(insertIndex, 0, updatedRow);
  } else {
    newData.push(updatedRow);
  }
  
  return newData;
};

// Move activities forward in time
export const moveActivitiesForward = (data: CSVRow[], startIndex: number, days: number = 5): CSVRow[] => {
  const newData = [...data];
  
  for (let i = startIndex; i < newData.length; i++) {
    newData[i] = {
      ...newData[i],
      prepDate: addDaysToDate(newData[i].prepDate, days),
      goDate: addDaysToDate(newData[i].goDate, days)
    };
  }
  
  return newData;
};

const addDaysToDate = (dateString: string, daysToAdd: number): string => {
  const parts = dateString.split('/');
  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  date.setDate(date.getDate() + daysToAdd);
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};
