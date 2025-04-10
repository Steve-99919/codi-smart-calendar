
export type EventStatus = 'pending' | 'done' | 'fail';

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
  event_type: 'prep' | 'go';
  status: EventStatus;
  status_updated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityWithStatus extends Activity {
  prep_status?: EventStatusRecord;
  go_status?: EventStatusRecord;
}
