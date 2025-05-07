
import { CSVRow } from "../types/csv";
import { isWeekend, isPublicHoliday, formatDate, isValidDateFormat } from "./dateUtils";

export const parseCSV = (content: string): CSVRow[] => {
  const rows = content.split(/\r?\n/);
  
  // Check if there's a header row
  let startIndex = 0;
  const firstRow = rows[0].toLowerCase();
  if (firstRow.includes('activity id') || firstRow.includes('name') || firstRow.includes('description')) {
    startIndex = 1;
  }
  
  const parsedRows: CSVRow[] = [];
  
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row) continue;
    
    // Split by commas, but respect quoted fields
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue.trim()); // Add the last value
    
    if (values.length >= 6) {
      const prepDate = formatDate(values[4]);
      const goDate = formatDate(values[5]);
      
      const csvRow: CSVRow = {
        activityId: values[0], // Accept any format of activity ID as is
        activityName: values[1],
        description: values[2],
        strategy: values[3],
        prepDate: prepDate,
        goDate: goDate,
        isWeekend: isWeekend(prepDate) || isWeekend(goDate),
        isHoliday: isPublicHoliday(prepDate) || isPublicHoliday(goDate)
      };
      
      parsedRows.push(csvRow);
    }
  }
  
  return parsedRows;
};
