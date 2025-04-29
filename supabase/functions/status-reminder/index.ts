
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
  // First do regular base64 encoding
  let encoded = btoa(str);
  // Then make it URL-safe by replacing + with - and / with _
  encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
  // Remove any trailing = padding
  encoded = encoded.replace(/=+$/, '');
  return encoded;
}

const handleStatusReminders = async (): Promise<Response> => {
  try {
    console.log("Starting status reminder process");
    
    // Get current date
    const now = new Date();
    console.log(`Current date and time: ${now.toISOString()}`);
    console.log(`Current UTC date: ${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`);
    
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
    console.log('Activities details:', JSON.stringify(activities, null, 2));

    // Filter activities that are still pending
    const pendingActivities = activities?.filter(activity => {
      const statuses = activity.event_statuses;
      return statuses.length === 0 || statuses[0].status === 'pending';
    });

    console.log(`${pendingActivities?.length || 0} activities still pending`);

    if (!pendingActivities || pendingActivities.length === 0) {
      console.log("No pending activities requiring reminders, finishing execution");
      return new Response(
        JSON.stringify({ message: "No pending activities requiring reminders" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get user emails
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

    // Send reminders
    console.log("Starting to send email reminders...");
    const reminderResults = await Promise.all(
      pendingActivities.map(async (activity) => {
        const email = userEmails[activity.user_id];
        if (!email) {
          console.warn(`No email found for user ${activity.user_id}`);
          return { success: false, activity: activity.activity_id, reason: "No email found" };
        }

        console.log(`Preparing email for activity ${activity.activity_id} to ${email}`);
        const statusId = activity.event_statuses[0]?.id || null;
        // Use the URL-safe encoding
        const tokenPayload = `${activity.id}:${statusId || 'new'}`;
        const verificationToken = urlSafeBase64Encode(tokenPayload);
        
        // URLs to point to our status-confirm page
        const confirmUrl = `${APP_URL}/status-confirm?token=${verificationToken}&status=done`;
        const delayUrl = `${APP_URL}/status-confirm?token=${verificationToken}&status=delayed`;

        console.log("Token payload:", tokenPayload);
        console.log("URL-safe encoded token:", verificationToken);
        console.log("Confirmation URL:", confirmUrl);
        console.log("Delay URL:", delayUrl);

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
          return { success: true, activity: activity.activity_id, email };
        } catch (emailError) {
          console.error(`Error sending email for activity ${activity.activity_id} to ${email}:`, emailError);
          return { success: false, activity: activity.activity_id, reason: "Email sending failed", error: emailError };
        }
      })
    );

    const successCount = reminderResults.filter(r => r.success).length;
    console.log(`Email reminder process completed. ${successCount}/${pendingActivities.length} emails sent successfully`);
    
    return new Response(
      JSON.stringify({ 
        message: "Status reminders processed", 
        results: reminderResults,
        activityCount: pendingActivities.length,
        successCount: successCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Comprehensive error in status reminder function:", error);
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
  
  // Route based on HTTP method
  if (req.method === "POST" || req.method === "GET") {
    return handleStatusReminders();
  }
  
  return new Response("Method not allowed", { status: 405 });
});
