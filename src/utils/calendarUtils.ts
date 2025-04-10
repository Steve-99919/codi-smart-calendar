
/**
 * Utilities for calendar operations including ICS file generation
 */

import { CSVRow } from "../types/csv";

// Convert CSV data to iCalendar (ICS) format with separate events for prep and go dates
export const generateICS = (data: CSVRow[], calendarName: string): string => {
  // ICS file header
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lovable//CSV Activity Calendar//EN',
    `X-WR-CALNAME:${calendarName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n') + '\r\n';
  
  // Add each activity as two separate events (PREP and GO)
  data.forEach(row => {
    // Parse the dates (convert from DD/MM/YYYY to YYYYMMDD format for ICS)
    const prepDateParts = row.prepDate.split('/');
    const goDayParts = row.goDate.split('/');
    
    if (prepDateParts.length !== 3 || goDayParts.length !== 3) {
      console.error('Invalid date format for activity:', row.activityId);
      return;
    }
    
    const prepDateFormatted = `${prepDateParts[2]}${prepDateParts[1]}${prepDateParts[0]}`;
    const goDateFormatted = `${goDayParts[2]}${goDayParts[1]}${goDayParts[0]}`;
    
    // Create unique identifiers for each event
    const prepUid = `PREP-${row.activityId}-${Date.now()}@lovable.app`;
    const goUid = `GO-${row.activityId}-${Date.now() + 1}@lovable.app`;
    
    // Create PREP event
    icsContent += [
      'BEGIN:VEVENT',
      `UID:${prepUid}`,
      `SUMMARY:[PREP] ${row.activityName}`,
      `DESCRIPTION:${row.description}\\nStrategy: ${row.strategy}\\nActivity ID: ${row.activityId}\\nType: PREPARATION`,
      `DTSTART;VALUE=DATE:${prepDateFormatted}`,
      `DTEND;VALUE=DATE:${prepDateFormatted}`,
      'SEQUENCE:0',
      `DTSTAMP:${formatDateForICS(new Date())}`,
      'END:VEVENT'
    ].join('\r\n') + '\r\n';
    
    // Create GO event
    icsContent += [
      'BEGIN:VEVENT',
      `UID:${goUid}`,
      `SUMMARY:[GO] ${row.activityName}`,
      `DESCRIPTION:${row.description}\\nStrategy: ${row.strategy}\\nActivity ID: ${row.activityId}\\nType: EXECUTION`,
      `DTSTART;VALUE=DATE:${goDateFormatted}`,
      `DTEND;VALUE=DATE:${goDateFormatted}`,
      'SEQUENCE:0',
      `DTSTAMP:${formatDateForICS(new Date())}`,
      'END:VEVENT'
    ].join('\r\n') + '\r\n';
  });
  
  // Close the calendar
  icsContent += 'END:VCALENDAR';
  
  return icsContent;
};

// Format a Date object to ICS format (YYYYMMDDTHHmmssZ)
const formatDateForICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

// Generate a downloadable ICS file from CSV data
export const downloadICS = (data: CSVRow[], calendarName: string): void => {
  const icsContent = generateICS(data, calendarName);
  
  // Create a blob and download link
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${calendarName.replace(/\s+/g, '_')}_activities.ics`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
