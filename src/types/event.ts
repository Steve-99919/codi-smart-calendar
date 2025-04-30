
export type EventStatus = 'upcoming' | 'completed' | 'delayed';

export interface Activity {
  id: string;
  user_id: string;
  activity_id: string;
  activity_name: string;
  description: string | null;
  strategy: string | null;
  prep_date: string;
  go_date: string;
  created_at: string;
}

export interface EventStatusRecord {
  id: string;
  activity_id: string;
  status: string;  // Use string type to handle both old and new status values
  status_updated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  event_type: string;  // Use string type to handle both old and new event_type values
}

export interface ActivityWithStatus extends Activity {
  status?: EventStatusRecord;
}
