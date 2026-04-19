import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? "Task App <no-reply@example.com>";
const resend = apiKey ? new Resend(apiKey) : null;

export async function sendMagicCode(email: string, code: string) {
  if (!resend) {
    console.warn("[mailer] RESEND_API_KEY not set, printing code instead");
    console.log(`[mailer] magic code for ${email}: ${code}`);
    return;
  }

  await resend.emails.send({
    from,
    to: email,
    subject: `Your Task App sign-in code: ${code}`,
    html: `<p>Your sign-in code is:</p><p style="font-size:28px;font-weight:600;letter-spacing:4px;">${code}</p><p>This code expires in 15 minutes.</p><p>If you didn't request this, ignore this email.</p>`,
    text: `Your Task App sign-in code: ${code}\n\nThis code expires in 15 minutes.`,
  });
}
