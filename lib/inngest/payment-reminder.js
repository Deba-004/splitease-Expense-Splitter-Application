import { ConvexHttpClient } from "convex/browser";
import { inngest } from "./client";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)

export const paymentReminder = inngest.createFunction(
  { id: "payment-reminder" },
  { cron: "0 10 * * 1" },
  async ({ step }) => {
    const users = await step.run("fetch-debts", () =>
      convex.query(api.inngest.getUserWithOutstandingDebts)
    );

    const results = await step.run("send-reminders", async () => {
      return Promise.all(
        users.map(async (user) => {
          const rows = user.debts
            .map((d) => (`
              <tr>
                <td style="padding:4px 8px;">${d.name}</td>
                <td style="padding:4px 8px;">$${d.amount.toFixed(2)}</td>
              </tr>
            `))
            .join("");

            if(!rows) return{ userId: user._id, skipped: true };

            const html = `
              <h2>splitease – Payment Reminder</h2>
              <p>Hi ${user.name}, you have the following outstanding balances:</p>
              <table cellspacing="0" cellpadding="0" border="1" style="border-collapse:collapse;">
                <thead>
                  <tr><th>To</th><th>Amount</th></tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            <p>Please settle up soon. Thanks!</p>
            `;

            try {
              await convex.action(api.email.sendEmail, {
                to: user.email,
                subject: `Payment Reminder for ${user.name} (splitease)`,
                html,
                apiKey: process.env.RESEND_API_KEY
              });
              return { userId: user._id, success: true };
            } catch (error) {
              return { userId: user._id, success: false, error: error.message };
            }
        })
      )
    });
    return {
      processed: results.length,
      successes: results.filter((r) => r.success).length,
      failures: results.filter((r) => !r.success).length
    };
  }
)