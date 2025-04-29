
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { 
  corsHeaders, 
  initSupabase, 
  fetchYesterdayActivities, 
  filterPendingActivities, 
  fetchUserEmails 
} from "./utils.ts";
import { sendReminderEmails } from "./email-service.ts";

// Main handler function for status reminders
const handleStatusReminders = async (): Promise<Response> => {
  try {
    console.log("Starting status reminder process");
    
    // Initialize the Supabase client
    const supabase = initSupabase();
    
    // Step 1: Fetch activities with yesterday's prep date
    const { activities } = await fetchYesterdayActivities(supabase);

    // Step 2: Filter for pending activities
    const pendingActivities = filterPendingActivities(activities);

    // Step 3: If no pending activities, return early
    if (!pendingActivities || pendingActivities.length === 0) {
      console.log("No pending activities requiring reminders, finishing execution");
      return new Response(
        JSON.stringify({ message: "No pending activities requiring reminders" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Step 4: Get user emails
    const userEmails = await fetchUserEmails(supabase, pendingActivities);

    // Step 5: Send reminder emails
    const reminderResults = await sendReminderEmails(pendingActivities, userEmails);

    // Step 6: Return the result summary
    const successCount = reminderResults.filter(r => r.success).length;
    
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
