
// Utility functions for the status-reminder edge function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Activity } from "./types.ts";

// Initialize Supabase client
export const initSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return createClient(supabaseUrl, supabaseServiceKey);
};

// CORS headers for API responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to create URL-safe base64 encoding
export function urlSafeBase64Encode(str: string): string {
  // First do regular base64 encoding
  let encoded = btoa(str);
  // Then make it URL-safe by replacing + with - and / with _
  encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
  // Remove any trailing = padding
  encoded = encoded.replace(/=+$/, '');
  return encoded;
}

// Function to fetch activities with preparation date from yesterday
export async function fetchYesterdayActivities(supabase: ReturnType<typeof initSupabase>) {
  // Get current date
  const now = new Date();
  
  // Calculate yesterday in YYYY-MM-DD format for database query
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];
  
  console.log(`Checking for prep dates that were yesterday: ${yesterdayFormatted}`);
  
  // Get activities whose prep_date was yesterday
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select(`
      id,
      activity_id,
      activity_name,
      prep_date,
      go_date,
      user_id,
      event_statuses(id, status)
    `)
    .eq('prep_date', yesterdayFormatted)
    .order('activity_id');

  if (activitiesError) {
    console.error("Error fetching activities:", activitiesError);
    throw activitiesError;
  }

  console.log(`Found ${activities?.length || 0} activities with prep date yesterday`);
  return { activities, yesterdayFormatted };
}

// New function to fetch activities with go date from yesterday
export async function fetchYesterdayGoDateActivities(supabase: ReturnType<typeof initSupabase>) {
  // Get current date
  const now = new Date();
  
  // Calculate yesterday in YYYY-MM-DD format for database query
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];
  
  console.log(`Checking for go dates that were yesterday: ${yesterdayFormatted}`);
  
  // Get activities whose go_date was yesterday
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select(`
      id,
      activity_id,
      activity_name,
      prep_date,
      go_date,
      user_id,
      event_statuses(id, status)
    `)
    .eq('go_date', yesterdayFormatted)
    .order('activity_id');

  if (activitiesError) {
    console.error("Error fetching activities:", activitiesError);
    throw activitiesError;
  }

  console.log(`Found ${activities?.length || 0} activities with go date yesterday`);
  return { activities, yesterdayFormatted };
}

// Function to filter activities that are still pending (now "upcoming")
export function filterPendingActivities(activities: Activity[]) {
  const pendingActivities = activities?.filter(activity => {
    const statuses = activity.event_statuses;
    return statuses.length === 0 || statuses[0].status === 'pending' || statuses[0].status === 'upcoming';
  });

  console.log(`${pendingActivities?.length || 0} activities still pending/upcoming`);
  return pendingActivities;
}

// Function to get user emails for the activities
export async function fetchUserEmails(
  supabase: ReturnType<typeof initSupabase>, 
  pendingActivities: Activity[]
) {
  if (!pendingActivities || pendingActivities.length === 0) {
    return {};
  }

  const userIds = [...new Set(pendingActivities.map(a => a.user_id))];
  console.log(`Finding emails for ${userIds.length} unique users:`, userIds);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);

  if (profilesError) {
    console.error("Error fetching user profiles:", profilesError);
    throw profilesError;
  }

  console.log(`Found ${profiles?.length || 0} user profiles`);

  // Create a map of user_id to email
  const userEmails: Record<string, string> = {};
  profiles?.forEach(profile => {
    if (profile.email) {
      userEmails[profile.id] = profile.email;
      console.log(`Mapped user ${profile.id} to email ${profile.email}`);
    } else {
      console.warn(`No email found for user ${profile.id}`);
    }
  });
  
  return userEmails;
}
