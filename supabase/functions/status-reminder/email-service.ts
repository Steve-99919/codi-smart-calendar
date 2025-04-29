
// Email service for the status-reminder edge function

import { Resend } from "npm:resend@2.0.0";
import { Activity } from "./types.ts";
import { urlSafeBase64Encode } from "./utils.ts";

// Hardcode the APP URL to the production domain
const APP_URL = "https://mightytouchstrategies.org";

// Initialize Resend client
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Function to send reminder emails
export async function sendReminderEmails(
  pendingActivities: Activity[], 
  userEmails: Record<string, string>
) {
  if (!pendingActivities || pendingActivities.length === 0) {
    return [];
  }

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
      const tokenPayload = `${activity.id}:${statusId || 'new'}`;
      const verificationToken = urlSafeBase64Encode(tokenPayload);
      
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
        return { 
          success: false, 
          activity: activity.activity_id, 
          reason: "Email sending failed", 
          error: emailError 
        };
      }
    })
  );

  const successCount = reminderResults.filter(r => r.success).length;
  console.log(`Email reminder process completed. Sent ${successCount}/${pendingActivities.length} emails successfully`);
  
  return reminderResults;
}
