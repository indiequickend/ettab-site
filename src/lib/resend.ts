import { Resend } from "resend";

let client: Resend | null = null;

function getResendClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string
): Promise<void> {
  await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "ETTAB Members <onboarding@resend.dev>",
    to,
    subject: "Verify your ETTAB Members Area account",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for registering for the ETTAB Members Area. Please verify your email address to continue:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
