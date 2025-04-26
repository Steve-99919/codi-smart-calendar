
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for API responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to create URL-safe base64 encoding
function urlSafeBase64Decode(str: string): string {
  // Replace URL-safe characters back to standard base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  try {
    return atob(base64);
  } catch (e) {
    console.error("Failed to decode base64 string:", e);
    throw new Error("Invalid token format");
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse URL to get query parameters
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const status = url.searchParams.get("status");

  if (!token || !status) {
    return new Response(
      JSON.stringify({ error: "Missing token or status" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  if (status !== "done" && status !== "delayed") {
    return new Response(
      JSON.stringify({ error: "Invalid status value" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  try {
    console.log("Processing token:", token);
    
    // Decode token (format: activityId:statusId)
    const decoded = urlSafeBase64Decode(token);
    console.log("Decoded token:", decoded);
    
    const [activityId, statusId] = decoded.split(":");
    console.log("ActivityId:", activityId, "StatusId:", statusId);
    
    if (!activityId) {
      throw new Error("Missing activity ID in token");
    }

    // First, verify the activity exists
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .maybeSingle();

    if (activityError) {
      console.error("Activity fetch error:", activityError);
      throw new Error(`Database error: ${activityError.message}`);
    }

    if (!activity) {
      console.error("Activity not found with ID:", activityId);
      throw new Error(`Activity with ID ${activityId} not found.`);
    }

    console.log("Activity found:", activity);
    
    let result;
    
    // If statusId is 'new', create new status record
    if (statusId === "new") {
      console.log("Creating new status record for activity:", activityId);
      
      const { data, error: insertError } = await supabase
        .from("event_statuses")
        .insert({
          activity_id: activityId,
          status: status,
          status_updated_at: new Date().toISOString(),
          event_type: "activity",
        })
        .select();

      if (insertError) {
        console.error("Status insert error:", insertError);
        throw new Error(`Failed to create status record: ${insertError.message}`);
      }

      console.log("New status created:", data);
      result = data;
    } else {
      console.log("Updating existing status record:", statusId);
      
      // Verify the status record exists
      const { data: statusRecord, error: statusError } = await supabase
        .from("event_statuses")
        .select("*")
        .eq("id", statusId)
        .maybeSingle();
        
      if (statusError) {
        console.error("Status fetch error:", statusError);
        throw new Error(`Database error: ${statusError.message}`);
      }
      
      if (!statusRecord) {
        console.log("Status record not found, creating new one");
        
        const { data, error: insertError } = await supabase
          .from("event_statuses")
          .insert({
            activity_id: activityId,
            status: status,
            status_updated_at: new Date().toISOString(),
            event_type: "activity",
          })
          .select();
          
        if (insertError) {
          console.error("Status insert error:", insertError);
          throw new Error(`Failed to create status record: ${insertError.message}`);
        }
        
        console.log("New status created:", data);
        result = data;
      } else {
        // Update existing status record
        const { data, error: updateError } = await supabase
          .from("event_statuses")
          .update({ 
            status: status,
            status_updated_at: new Date().toISOString()
          })
          .eq("id", statusId)
          .select();

        if (updateError) {
          console.error("Status update error:", updateError);
          throw new Error(`Failed to update status: ${updateError.message}`);
        }

        console.log("Status updated successfully");
        result = data;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Status updated to ${status}`, 
        activity: activity.activity_name,
        result 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (err: any) {
    console.error("Error updating status:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to update status" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
