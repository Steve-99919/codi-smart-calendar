
import { useState } from 'react';
import { CSVRow } from '@/types/csv';
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { isWeekend, isPublicHoliday, isValidDateFormat, getValidPrepDate } from '@/utils/dateUtils';

interface UseActivityFormStateProps {
  data: CSVRow[];
  activityIdPrefix: string;
  allowWeekends: boolean;
  allowHolidays: boolean;
}

// Helper function to generate abbreviated month
const getMonthAbbreviation = (date: Date): string => {
  return format(date, 'MMM').toUpperCase();
};

// Helper function to get acronym from activity name
const getActivityNameAcronym = (name: string): string => {
  if (!name) return '';
  
  // Split by spaces and get first letter of each word
  const words = name.trim().split(/\s+/);
  const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
  
  // Return up to first 3 characters
  return acronym.substring(0, 3);
};

export const useActivityFormState = ({
  data,
  activityIdPrefix,
  allowWeekends,
  allowHolidays
}: UseActivityFormStateProps) => {
  const [selectedPrepDate, setSelectedPrepDate] = useState<Date>();
  const [selectedGoDate, setSelectedGoDate] = useState<Date>();
  const [isProcessingActivity, setIsProcessingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<CSVRow>({
    activityId: "", // Start with empty activityId
    activityName: "",
    description: "",
    strategy: "",
    prepDate: "",
    goDate: "",
    isWeekend: false,
    isHoliday: false
  });

  const handlePrepDateSelect = (date: Date | undefined) => {
    setSelectedPrepDate(date);
    if (date) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      const isDateOnWeekend = isWeekend(formattedDate);
      const isDateOnHoliday = isPublicHoliday(formattedDate);
      
      if (isDateOnWeekend && !allowWeekends) {
        toast.error("You have selected a weekend date. Please enable weekend dates in preferences or select another date.");
        setSelectedPrepDate(undefined);
        return;
      }
      
      if (isDateOnHoliday && !allowHolidays) {
        toast.error("You have selected a public holiday. Please enable holiday dates in preferences or select another date.");
        setSelectedPrepDate(undefined);
        return;
      }
      
      setNewActivity(prev => ({
        ...prev,
        prepDate: formattedDate
      }));
    }
  };

  const handleGoDateSelect = (date: Date | undefined) => {
    setSelectedGoDate(date);
    if (date) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      const isDateOnWeekend = isWeekend(formattedDate);
      const isDateOnHoliday = isPublicHoliday(formattedDate);
      
      if (isDateOnWeekend && !allowWeekends) {
        toast.error("You have selected a weekend date. Please enable weekend dates in preferences or select another date.");
        setSelectedGoDate(undefined);
        return;
      }
      
      if (isDateOnHoliday && !allowHolidays) {
        toast.error("You have selected a public holiday. Please enable holiday dates in preferences or select another date.");
        setSelectedGoDate(undefined);
        return;
      }
      
      // Calculate prep date (3 days before go date)
      const prepDate = subDays(date, 3);
      const prepDateFormatted = format(prepDate, 'dd/MM/yyyy');
      const isPrepOnWeekend = isWeekend(prepDateFormatted);
      const isPrepOnHoliday = isPublicHoliday(prepDateFormatted);
      
      // If prep date would fall on a weekend/holiday, adjust it based on preferences
      if ((isPrepOnWeekend && !allowWeekends) || (isPrepOnHoliday && !allowHolidays)) {
        // Get a valid prep date that respects the preferences
        const validPrepDate = getValidPrepDate(prepDate, allowWeekends, allowHolidays);
        const validPrepDateFormatted = format(validPrepDate, 'dd/MM/yyyy');
        
        setSelectedPrepDate(validPrepDate);
        setNewActivity(prev => ({
          ...prev,
          goDate: formattedDate,
          prepDate: validPrepDateFormatted
        }));
        
        toast.info("Prep date has been automatically adjusted to avoid weekend/holiday based on your preferences");
      } else {
        setSelectedPrepDate(prepDate);
        setNewActivity(prev => ({
          ...prev,
          goDate: formattedDate,
          prepDate: prepDateFormatted
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Generate ID manually when requested
  const generateActivityId = (): boolean => {
    if (!selectedGoDate || !newActivity.activityName) {
      toast.error("Please enter an activity name and select a go date before generating an ID");
      return false;
    }
    
    try {
      // Get acronym from activity name (first letters of each word)
      const nameAcronym = getActivityNameAcronym(newActivity.activityName);
      
      // Get 3-letter month abbreviation
      const monthAbbrev = getMonthAbbreviation(selectedGoDate);
      
      // Get day (2 digits)
      const day = format(selectedGoDate, 'dd');
      
      // Get year (last 2 digits)
      const year = format(selectedGoDate, 'yy');
      
      // Construct the new ID: [name acronym]-[month]-[day]-[year]
      const newId = `${nameAcronym}-${monthAbbrev}${day}-${year}`;
      console.log("Generated activity ID:", newId);
      
      // Update the activity ID
      setNewActivity(prev => ({
        ...prev,
        activityId: newId
      }));
      
      return true;
    } catch (error) {
      console.error("Error generating activity ID:", error);
      toast.error("Error generating activity ID");
      return false;
    }
  };

  const validateForm = () => {
    if (!newActivity.activityName || 
        !newActivity.prepDate || !newActivity.goDate) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (!isValidDateFormat(newActivity.prepDate) || !isValidDateFormat(newActivity.goDate)) {
      toast.error("Please enter dates in dd/mm/yyyy format");
      return false;
    }
    
    // Validate activity ID
    if (!newActivity.activityId) {
      toast.error("Please generate an activity ID before submitting");
      return false;
    }

    // Validate weekend and holiday restrictions
    const isPrepWeekend = isWeekend(newActivity.prepDate);
    const isGoWeekend = isWeekend(newActivity.goDate);
    const isPrepHoliday = isPublicHoliday(newActivity.prepDate);
    const isGoHoliday = isPublicHoliday(newActivity.goDate);

    if ((isPrepWeekend || isGoWeekend) && !allowWeekends) {
      toast.error("One or more selected dates fall on a weekend. Please enable weekend dates in preferences or select different dates.");
      return false;
    }

    if ((isPrepHoliday || isGoHoliday) && !allowHolidays) {
      toast.error("One or more selected dates fall on a public holiday. Please enable holiday dates in preferences or select different dates.");
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setNewActivity({
      activityId: "", // Reset to empty string
      activityName: "",
      description: "",
      strategy: "",
      prepDate: "",
      goDate: "",
      isWeekend: false,
      isHoliday: false
    });
    setSelectedPrepDate(undefined);
    setSelectedGoDate(undefined);
  };

  return {
    selectedPrepDate,
    selectedGoDate,
    newActivity,
    isProcessingActivity,
    setIsProcessingActivity,
    handlePrepDateSelect,
    handleGoDateSelect,
    handleInputChange,
    generateActivityId,
    validateForm,
    resetForm,
    setNewActivity
  };
};
