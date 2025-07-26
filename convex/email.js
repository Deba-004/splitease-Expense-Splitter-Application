import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";
import { api } from "./_generated/api";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const APIKEY = args.apiKey;
    const toEmail = "debasishsarkar452@gmail.com";
    const resend = new Resend(APIKEY);

    try {
      const result = await resend.emails.send({
        from: "splitease <onboarding@resend.dev>",
        to: toEmail,
        subject: args.subject,
        html: args.html,
        text: args.text
      });
      console.log("Email sent successfully:", result);
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  }
});