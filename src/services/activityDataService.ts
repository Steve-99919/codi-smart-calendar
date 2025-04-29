
import { CSVRow } from '@/types/csv';
import { isDateBefore } from '@/utils/dateUtils';

export const parseActivityId = (id: string) => {
  const match = id.match(/([A-Za-z]+)(\d+)/);
  return match ? { prefix: match[1], number: parseInt(match[2]) } : null;
};

export const getNextNumber = (data: CSVRow[], prefix: string) => {
  const relevantIds = data
    .map(item => parseActivityId(item.activityId))
    .filter(parsed => parsed?.prefix === prefix);
  
  if (relevantIds.length === 0) return 1;
  
  const maxNumber = Math.max(...relevantIds.map(parsed => parsed?.number || 0));
  return maxNumber + 1;
};

export const addActivity = (data: CSVRow[], newActivity: CSVRow): CSVRow[] => {
  const newData = [...data];
  
  const insertIndex = newData.findIndex(
    item => !isDateBefore(item.prepDate, newActivity.prepDate)
  );
  
  if (insertIndex >= 0) {
    newData.splice(insertIndex, 0, newActivity);
    reindexActivities(newData);
  } else {
    newData.push(newActivity);
    
    const parsed = parseActivityId(newActivity.activityId);
    if (parsed) {
      const samePrefix = newData.filter(row => {
        const p = parseActivityId(row.activityId);
        return p?.prefix === parsed.prefix;
      });
      
      const numbers = samePrefix
        .map(row => {
          const p = parseActivityId(row.activityId);
          return p ? p.number : 0;
        })
        .filter(num => num > 0);
      
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      newActivity.activityId = `${parsed.prefix}${maxNumber + 1}`;
    }
  }
  
  return newData;
};

export const updateActivity = (data: CSVRow[], index: number, updatedRow: CSVRow): CSVRow[] => {
  const newData = [...data];
  newData.splice(index, 1);
  
  const insertIndex = newData.findIndex(
    item => !isDateBefore(item.prepDate, updatedRow.prepDate)
  );
  
  if (insertIndex >= 0) {
    newData.splice(insertIndex, 0, updatedRow);
    reindexActivities(newData);
  } else {
    newData.push(updatedRow);
    const parsed = parseActivityId(updatedRow.activityId);
    if (parsed) {
      const samePrefix = newData.filter(row => {
        const p = parseActivityId(row.activityId);
        return p?.prefix === parsed.prefix;
      });
      updatedRow.activityId = `${parsed.prefix}${samePrefix.length}`;
    }
  }
  
  return newData;
};

export const reindexActivities = (data: CSVRow[]) => {
  const prefixGroups = new Map<string, CSVRow[]>();
  
  data.forEach(row => {
    const parsed = parseActivityId(row.activityId);
    if (parsed) {
      const { prefix } = parsed;
      if (!prefixGroups.has(prefix)) {
        prefixGroups.set(prefix, []);
      }
      prefixGroups.get(prefix)?.push(row);
    }
  });
  
  prefixGroups.forEach((rows, prefix) => {
    rows.sort((a, b) => {
      if (a.prepDate !== b.prepDate) {
        return isDateBefore(a.prepDate, b.prepDate) ? -1 : 1;
      }
      return 0;
    });
    
    rows.forEach((row, idx) => {
      row.activityId = `${prefix}${idx + 1}`;
    });
  });
};

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
