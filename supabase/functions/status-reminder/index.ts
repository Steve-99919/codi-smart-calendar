
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { 
  corsHeaders, 
  initSupabase, 
  fetchYesterdayActivities,
  fetchYesterdayGoDateActivities,
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
    
    // --- Process prep date reminders first ---
    
    // Step 1: Fetch activities with yesterday's prep date
    const { activities: prepDateActivities } = await fetchYesterdayActivities(supabase);

    // Step 2: Filter for upcoming activities
    const upcomingActivities = filterPendingActivities(prepDateActivities);

    // Step 3: Process prep date emails if there are any upcoming activities
    let prepDateResults = [];
    if (upcomingActivities && upcomingActivities.length > 0) {
      // Get user emails
      const userEmails = await fetchUserEmails(supabase, upcomingActivities);
      
      // Send prep date reminder emails
      prepDateResults = await sendReminderEmails(upcomingActivities, userEmails, 'prep');
    }
    
    // --- Process go date reminders next ---
    
    // Step 4: Fetch activities with yesterday's go date
    const { activities: goDateActivities } = await fetchYesterdayGoDateActivities(supabase);
    
    // Step 5: Filter for activities that need status updates
    const needUpdateActivities = filterPendingActivities(goDateActivities);
    
    // Step 6: Process go date emails if there are any activities needing updates
    let goDateResults = [];
    if (needUpdateActivities && needUpdateActivities.length > 0) {
      // Get user emails
      const userEmails = await fetchUserEmails(supabase, needUpdateActivities);
      
      // Send go date reminder emails
      goDateResults = await sendReminderEmails(needUpdateActivities, userEmails, 'go');
    }
    
    // Step 7: Return the result summary
    const totalActivities = (upcomingActivities?.length || 0) + (needUpdateActivities?.length || 0);
    const totalSuccessCount = prepDateResults.filter(r => r.success).length + 
                             goDateResults.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({ 
        message: "Status reminders processed", 
        prepDateResults: prepDateResults,
        goDateResults: goDateResults,
        totalActivityCount: totalActivities,
        totalSuccessCount: totalSuccessCount
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
