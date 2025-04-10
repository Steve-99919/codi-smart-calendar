
export interface CSVRow {
  activityId: string;
  activityName: string;
  description: string;
  strategy: string;
  prepDate: string;
  goDate: string;
  isWeekend?: boolean;
  isHoliday?: boolean;
}
