
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Resend client
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Hardcode the APP URL to the production domain
const APP_URL = "https://mightytouchstrategies.org";

// CORS headers for API responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to create URL-safe base64 encoding
function urlSafeBase64Encode(str: string): string {
  let encoded = btoa(str);
  encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
  encoded = encoded.replace(/=+$/, '');
  return encoded;
}

// Function to fetch activities based on a specific prep date
async function fetchActivitiesForDate(dateStr: string) {
  console.log(`Using test prep date: ${dateStr}`);
  
  // Get activities whose prep_date matches the specified date
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
    .eq('prep_date', dateStr)
    .order('activity_id');

  if (activitiesError) {
    console.error("Error fetching activities:", activitiesError);
    throw activitiesError;
  }

  console.log(`Found ${activities?.length || 0} activities with prep date: ${dateStr}`);
  return activities;
}

// Function to filter activities that are still pending
function filterPendingActivities(activities) {
  const pendingActivities = activities?.filter(activity => {
    const statuses = activity.event_statuses;
    return statuses.length === 0 || statuses[0].status === 'pending';
  });

  console.log(`${pendingActivities?.length || 0} activities still pending`);
  return pendingActivities;
}

// Function to get user emails for the activities
async function fetchUserEmails(pendingActivities) {
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

  console.log(`Found ${profiles?.length || 0} user profiles:`, JSON.stringify(profiles, null, 2));

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

// Function to handle reminder emails (send or simulate)
async function processReminderEmails(pendingActivities, userEmails, dryRun: boolean) {
  if (!pendingActivities || pendingActivities.length === 0) {
    return [];
  }

  console.log(`${dryRun ? 'DRY RUN: Simulating' : 'Starting to send'} email reminders...`);
  
  const reminderResults = await Promise.all(
    pendingActivities.map(async (activity) => {
      const email = userEmails[activity.user_id];
      if (!email) {
        console.warn(`No email found for user ${activity.user_id}`);
        return { success: false, activity: activity.activity_id, reason: "No email found" };
      }

      console.log(`${dryRun ? 'Would send' : 'Preparing'} email for activity ${activity.activity_id} to ${email}`);
      const statusId = activity.event_statuses[0]?.id || null;
      const tokenPayload = `${activity.id}:${statusId || 'new'}`;
      const verificationToken = urlSafeBase64Encode(tokenPayload);
      
      const confirmUrl = `${APP_URL}/status-confirm?token=${verificationToken}&status=done`;
      const delayUrl = `${APP_URL}/status-confirm?token=${verificationToken}&status=delayed`;

      console.log("Token payload:", tokenPayload);
      console.log("URL-safe encoded token:", verificationToken);
      console.log("Confirmation URL:", confirmUrl);
      console.log("Delay URL:", delayUrl);

      if (dryRun) {
        return { 
          success: true, 
          activity: activity.activity_id, 
          email, 
          simulated: true,
          urls: { confirm: confirmUrl, delay: delayUrl }
        };
      }
      
      try {
        const emailResult = await resend.emails.send({
          from: "Activity Manager <notifications@mightytouchstrategies.org>",
          to: [email],
          subject: `Status Update Required: ${activity.activity_name}`,
          html: `
            <h1>Activity Status Update</h1>
            <p>Hello,</p>
            <p>Your activity "${activity.activity_name}" (ID: ${activity.activity_id}) had its preparation phase yesterday.</p>
            <p>Please confirm if this activity is progressing as planned and expected to be completed by the scheduled completion date (${new Date(activity.go_date).toLocaleDateString()}).</p>
            <p>
              <a href="${confirmUrl}" style="background-color: #10B981; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-right: 10px;">
                Yes, On Track
              </a>
              <a href="${delayUrl}" style="background-color: #EF4444; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
                No, Delayed
              </a>
            </p>
            <p>If you don't respond, the activity will remain in "Pending" status.</p>
            <p>Thank you,<br>Activity Manager</p>
          `,
        });

        console.log(`Email sent successfully for activity ${activity.activity_id} to ${email}:`, emailResult);
        return { success: true, activity: activity.activity_id, email, emailId: emailResult.data?.id };
      } catch (emailError) {
        console.error(`Error sending email for activity ${activity.activity_id} to ${email}:`, emailError);
        return { success: false, activity: activity.activity_id, reason: "Email sending failed", error: emailError };
      }
    })
  );

  return reminderResults;
}

// Main handler function for testing status reminders
const handleTestStatusReminders = async (req: Request): Promise<Response> => {
  try {
    // Parse request parameters
    const url = new URL(req.url);
    const testDate = url.searchParams.get('date');
    
    // Parse the body if it exists
    let body = {};
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await req.json();
      }
    }
    
    console.log("Starting test status reminder process");
    console.log(`Test parameters: ${JSON.stringify({ testDate, ...body })}`);
    
    // Determine test date
    let yesterday;
    if (testDate) {
      yesterday = new Date(testDate);
    } else {
      const now = new Date();
      yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
    }
    
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
    
    // Step 1: Fetch activities for the test date
    const activities = await fetchActivitiesForDate(yesterdayFormatted);
    
    // Step 2: Filter for pending activities
    const pendingActivities = filterPendingActivities(activities);

    // Step 3: If no pending activities, return early
    if (!pendingActivities || pendingActivities.length === 0) {
      console.log("No pending activities requiring reminders, finishing execution");
      return new Response(
        JSON.stringify({ 
          message: "No pending activities requiring reminders", 
          testDate: yesterdayFormatted,
          activitiesFound: activities?.length || 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Step 4: Get user emails
    const userEmails = await fetchUserEmails(pendingActivities);

    // Step 5: Process reminder emails (send or simulate based on dryRun)
    const dryRun = body.dryRun === true || url.searchParams.get('dryRun') === 'true';
    const reminderResults = await processReminderEmails(pendingActivities, userEmails, dryRun);

    // Step 6: Return the result summary
    const successCount = reminderResults.filter(r => r.success).length;
    const actualSentCount = reminderResults.filter(r => r.success && !r.simulated).length;
    
    console.log(`Test reminder process completed. ${dryRun ? 'Would have sent' : 'Sent'} ${successCount}/${pendingActivities.length} emails ${dryRun ? '(dry run)' : 'successfully'}`);
    
    return new Response(
      JSON.stringify({ 
        message: `Status reminders ${dryRun ? 'simulated' : 'processed'}`, 
        testDate: yesterdayFormatted,
        results: reminderResults,
        activityCount: pendingActivities.length,
        successCount: successCount,
        actualSentCount: dryRun ? 0 : actualSentCount,
        dryRun: dryRun
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Comprehensive error in test status reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

// Handle CORS preflight requests
const handleCORS = (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
};

// Main handler function
serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;
  
  // Handle test reminder request
  return handleTestStatusReminders(req);
});
