
import { useState, useEffect } from 'react';
import { CSVRow } from '@/types/csv';
import { toast } from "sonner";
import { parseCSV } from '@/utils/csvUtils';

const LOCAL_STORAGE_KEY = 'dashboard_csv_data';

export const useCSVPersistence = () => {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);

  // Load saved CSV data from localStorage when the hook is initialized
  useEffect(() => {
    const loadSavedData = () => {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setCsvData(parsedData);
          setHasUploadedFile(parsedData.length > 0);
        } catch (error) {
          console.error('Error parsing saved CSV data:', error);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    };

    loadSavedData();
  }, []);

  // Save CSV data to localStorage whenever it changes
  useEffect(() => {
    if (csvData.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(csvData));
    }
  }, [csvData]);

  const handleFileLoaded = (content: string) => {
    try {
      const parsedData = parseCSV(content);
      if (parsedData.length === 0) {
        toast.error('No valid data found in CSV file');
        return;
      }
      
      const processedData = parsedData.map((row, index) => {
        const match = row.activityId.match(/([A-Za-z]+)(\d+)/);
        if (!match) {
          return {
            ...row,
            activityId: `A${index + 1}`
          };
        }
        return row;
      });
      
      setCsvData(processedData);
      setHasUploadedFile(true);
      toast.success(`Successfully loaded ${processedData.length} rows of data`);
      
      // Save to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(processedData));
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV file');
    }
  };

  const updateData = (newData: CSVRow[]) => {
    setCsvData(newData);
    // localStorage is updated via useEffect when csvData changes
  };

  const clearData = () => {
    setCsvData([]);
    setHasUploadedFile(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return {
    csvData,
    setCsvData,
    hasUploadedFile,
    setHasUploadedFile,
    handleFileLoaded,
    updateData,
    clearData
  };
};
