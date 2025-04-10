
// Function to check if a date is a weekend
export const isWeekend = (dateStr: string): boolean => {
  // Parse the date in dd/mm/yyyy format
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  // 0 is Sunday, 6 is Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// Australian public holidays for 2024-2025
// This is a simplified list and should be replaced with an API call for production use
const australianHolidays: string[] = [
  "01/01/2024", // New Year's Day
  "26/01/2024", // Australia Day
  "29/03/2024", // Good Friday
  "01/04/2024", // Easter Monday
  "25/04/2024", // Anzac Day
  "10/06/2024", // King's Birthday
  "25/12/2024", // Christmas Day
  "26/12/2024", // Boxing Day
  "01/01/2025", // New Year's Day
  "26/01/2025", // Australia Day
  "18/04/2025", // Good Friday
  "21/04/2025", // Easter Monday
  "25/04/2025", // Anzac Day
];

export const isPublicHoliday = (dateStr: string): boolean => {
  return australianHolidays.includes(dateStr);
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
  
  // Try to convert from other common formats to dd/mm/yyyy
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if parsing failed
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr; // Return original if conversion failed
  }
};
