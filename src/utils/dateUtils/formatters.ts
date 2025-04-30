
import { format } from "date-fns";

// Format and validation functions
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

  // Handle common cases of day or month single digits without leading zeros
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
      day = p1;
      month = p0;
      year = p2;
    } else {
      // When both <= 12, assume dd/mm/yyyy as default (Australian format)
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
