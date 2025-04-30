
export type EventStatus = 'upcoming' | 'completed' | 'delayed' | 'pending' | 'done';

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
  status: EventStatus;
  status_updated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  event_type: EventStatus; // Make sure event_type is also of type EventStatus
}

export interface ActivityWithStatus extends Activity {
  status?: EventStatusRecord;
}
