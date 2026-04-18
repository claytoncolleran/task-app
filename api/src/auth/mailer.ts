import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? "Task App <no-reply@example.com>";
const resend = apiKey ? new Resend(apiKey) : null;

export async function sendMagicLink(email: string, url: string) {
  if (!resend) {
    console.warn("[mailer] RESEND_API_KEY not set, printing link instead");
    console.log(`[mailer] magic link for ${email}: ${url}`);
    return;
  }

  await resend.emails.send({
    from,
    to: email,
    subject: "Your Task App sign-in link",
    html: `<p>Click to sign in. Link expires in 15 minutes.</p><p><a href="${url}">Sign in to Task App</a></p><p>If you didn't request this, ignore this email.</p>`,
    text: `Sign in to Task App (link expires in 15 minutes):\n${url}`,
  });
}
