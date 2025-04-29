
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { isWeekend, isPublicHoliday } from '@/utils/dateUtils';

export const useTableFilters = () => {
  const [showWeekends, setShowWeekends] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const isDuplicateDate = (date: string, currentIndex: number, data: CSVRow[]): boolean => {
    return data.some((row, index) => 
      index !== currentIndex && (row.prepDate === date || row.goDate === date)
    );
  };
  
  const getRowHighlightClass = (row: CSVRow, index: number, data: CSVRow[]): string => {
    if (showWeekends && (isWeekend(row.prepDate) || isWeekend(row.goDate))) {
      return "bg-red-50";
    }
    if (showHolidays && (isPublicHoliday(row.prepDate) || isPublicHoliday(row.goDate))) {
      return "bg-red-50";
    }
    if (showDuplicates && (
      isDuplicateDate(row.prepDate, index, data) || 
      isDuplicateDate(row.goDate, index, data)
    )) {
      return "bg-red-50";
    }
    return "";
  };

  return {
    showWeekends,
    setShowWeekends,
    showHolidays,
    setShowHolidays,
    showDuplicates,
    setShowDuplicates,
    getRowHighlightClass,
    isDuplicateDate
  };
};
