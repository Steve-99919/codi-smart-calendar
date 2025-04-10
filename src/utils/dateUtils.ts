
// Function to check if a date is a weekend
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
