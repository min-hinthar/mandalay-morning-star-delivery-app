import { Resend } from "resend";

import { DriverInviteEmail } from "@/emails/DriverInviteEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS ||
  "Mandalay Morning Star <admin@mandalaymorningstar.com>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface SendEmailResult {
  data: { id: string } | null;
  error: { message: string; name: string } | null;
}

/**
 * Send driver invite email with onboarding link
 */
export async function sendDriverInvite(
  email: string,
  token: string,
  expiresAt: Date
): Promise<SendEmailResult> {
  const inviteUrl = `${BASE_URL}/driver/onboard/${token}`;
  const expiresAtFormatted = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "You're invited to join Mandalay Morning Star Delivery",
    react: DriverInviteEmail({
      inviteUrl,
      expiresAt: expiresAtFormatted,
    }),
  });

  return { data, error };
}
