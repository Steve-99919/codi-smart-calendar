
// Type definitions for the status-reminder edge function

export interface EventStatus {
  id: string;
  status: 'upcoming' | 'completed' | 'delayed' | 'pending' | 'done';
}

export interface Activity {
  id: string;
  activity_id: string;
  activity_name: string;
  prep_date: string;
  go_date: string;
  user_id: string;
  event_statuses: EventStatus[];
}

export interface EmailResult {
  success: boolean;
  activity: string;
  email?: string;
  reason?: string;
  error?: any;
}
