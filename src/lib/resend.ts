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
    subject: "Verify your ETTAB Member account",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for registering for the ETTAB Member. Please verify your email address to continue:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
    `,
  });
}

export async function sendMemberCreatedEmail(
  to: string,
  name: string,
  tempPassword: string
): Promise<void> {
  const loginUrl = `${process.env.NEXTAUTH_URL ?? ""}/login`;
  await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "ETTAB Members <onboarding@resend.dev>",
    to,
    subject: "Your ETTAB Member account has been created",
    html: `
      <p>Hi ${name},</p>
      <p>An ETTAB admin has created a member account for you. You can log in with:</p>
      <ul>
        <li>Email: ${to}</li>
        <li>Temporary password: <strong>${tempPassword}</strong></li>
      </ul>
      <p><a href="${loginUrl}">Log in</a> and change your password from your account settings as soon as possible.</p>
    `,
  });
}

export async function sendAdminNewRegistrationEmail(
  recipients: { name: string; email: string }[],
  applicant: { name: string; email: string; companyName: string }
): Promise<void> {
  const membersUrl = `${process.env.NEXTAUTH_URL ?? ""}/admin/members`;
  await Promise.all(
    recipients.map(async (recipient) => {
      try {
        await getResendClient().emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "ETTAB Members <onboarding@resend.dev>",
          to: recipient.email,
          subject: "New member registration pending approval — ETTAB",
          html: `
            <p>Hi ${recipient.name},</p>
            <p>A new member has registered for the ETTAB Member and is awaiting approval:</p>
            <ul>
              <li>Name: ${applicant.name}</li>
              <li>Email: ${applicant.email}</li>
              <li>Company: ${applicant.companyName}</li>
            </ul>
            <p><a href="${membersUrl}">Review pending registrations</a></p>
          `,
        });
      } catch (err) {
        console.error(`Failed to send admin notification email to ${recipient.email}`, err);
      }
    })
  );
}

export async function sendPartnerInviteEmail(
  to: string,
  companyName: string,
  inviterName: string,
  acceptUrl: string
): Promise<void> {
  await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "ETTAB Members <onboarding@resend.dev>",
    to,
    subject: `${inviterName} invited you to join ${companyName} on ETTAB Members`,
    html: `
      <p>Hi,</p>
      <p>${inviterName} has invited you to join <strong>${companyName}</strong> as a partner on the ETTAB Member portal:</p>
      <p><a href="${acceptUrl}">${acceptUrl}</a></p>
      <p>This link expires in 7 days. If you weren't expecting this invite, you can ignore this email.</p>
    `,
  });
}

export async function sendApprovalDecisionEmail(
  to: string,
  name: string,
  decision: { status: "approved" } | { status: "rejected"; reason?: string | null }
): Promise<void> {
  const subject =
    decision.status === "approved"
      ? "Your ETTAB Member registration has been approved"
      : "Your ETTAB Member registration was not approved";

  const html =
    decision.status === "approved"
      ? `
        <p>Hi ${name},</p>
        <p>Your ETTAB Member registration has been approved. You can now log in:</p>
        <p><a href="${process.env.NEXTAUTH_URL ?? ""}/login">Log in</a></p>
      `
      : `
        <p>Hi ${name},</p>
        <p>Your ETTAB Member registration was not approved.</p>
        ${decision.reason ? `<p>Reason: ${decision.reason}</p>` : ""}
        <p>If you have questions, please contact the ETTAB admin.</p>
      `;

  await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "ETTAB Members <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}
