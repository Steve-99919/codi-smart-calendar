
// Email service for the status-reminder edge function

import { Resend } from "npm:resend@2.0.0";
import { Activity } from "./types.ts";
import { urlSafeBase64Encode } from "./utils.ts";

// Hardcode the APP URL to the production domain
const APP_URL = "https://mightytouchstrategies.org";

// Initialize Resend client
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Valid status values - must match EventStatus type in frontend
const VALID_STATUSES = ['upcoming', 'completed', 'delayed', 'pending', 'done'];

// Function to send reminder emails
export async function sendReminderEmails(
  pendingActivities: Activity[], 
  userEmails: Record<string, string>,
  emailType: 'prep' | 'go' = 'prep'
) {
  if (!pendingActivities || pendingActivities.length === 0) {
    return [];
  }

  console.log(`Starting to send ${emailType} date email reminders...`);
  
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
      
      // Use proper status values for the URLs - these must match the valid statuses in the update function
      const delayUrl = `${APP_URL}/status-confirm?token=${verificationToken}&status=delayed`;
      const completeUrl = `${APP_URL}/status-confirm?token=${verificationToken}&status=completed`;

      console.log("Token payload:", tokenPayload);
      console.log("URL-safe encoded token:", verificationToken);
      console.log("Completion URL:", completeUrl);
      console.log("Delay URL:", delayUrl);
      
      try {
        let htmlContent = '';
        let subject = '';
        
        if (emailType === 'prep') {
          subject = `Action Required: Upcoming Activity ${activity.activity_name}`;
          
          // For prep date emails, only show the delayed option
          htmlContent = `
            <h1>Upcoming Activity Notice</h1>
            <p>Hello,</p>
            <p>You have an upcoming activity "${activity.activity_name}" (ID: ${activity.activity_id}) scheduled for ${new Date(activity.go_date).toLocaleDateString()}.</p>
            <p>Yesterday was the preparation date for this activity. If everything is on track, no action is needed.</p>
            <p>If preparation didn't go well, please click the button below:</p>
            <p>
              <a href="${delayUrl}" style="background-color: #EF4444; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
                Mark as Delayed
              </a>
            </p>
            <p>If you don't respond, the activity will remain in "Upcoming" status.</p>
            <p>Thank you,<br>Activity Manager</p>
          `;
        } else { // go date email
          subject = `Status Update Needed: Activity ${activity.activity_name}`;
          
          // For go date emails, show both completed and delayed options
          htmlContent = `
            <h1>Activity Status Update</h1>
            <p>Hello,</p>
            <p>Your activity "${activity.activity_name}" (ID: ${activity.activity_id}) was scheduled to be completed yesterday.</p>
            <p>Please confirm the current status of this activity:</p>
            <p>
              <a href="${completeUrl}" style="background-color: #10B981; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-right: 10px;">
                Completed Successfully
              </a>
              <a href="${delayUrl}" style="background-color: #EF4444; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
                Delayed
              </a>
            </p>
            <p>Thank you,<br>Activity Manager</p>
          `;
        }

        const emailResult = await resend.emails.send({
          from: "Activity Manager <notifications@mightytouchstrategies.org>",
          to: [email],
          subject: subject,
          html: htmlContent,
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
