import { Resend } from 'resend';
import { UserRole } from '@/types/domain';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() || 'ReuseFlow <info@ensure.in>';
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://reuseflow.vercel.app';
  return { apiKey, fromEmail, siteUrl };
}

export async function sendRegistrationWelcomeEmail(params: {
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  jobTitle: string;
}): Promise<{ ok: boolean; providerId?: string; message?: string }> {
  const { apiKey, fromEmail, siteUrl } = getResendConfig();
  if (!apiKey) {
    return {
      ok: false,
      message: 'RESEND_API_KEY is not configured in this environment.',
    };
  }

  const recipient = params.email.trim().toLowerCase();
  const safeName = escapeHtml(params.displayName.trim() || 'Staff Member');
  const safeDept = escapeHtml(params.department.trim() || 'Refurbishment Operations');
  const safeTitle = escapeHtml(params.jobTitle.trim() || 'Refurbishment Specialist');
  const safeRole = escapeHtml(params.role.toUpperCase());
  const appLink = `${siteUrl}/app`;

  const subject = `Welcome to ReuseFlow — Your Refurbishment Workspace is Ready`;
  const text = [
    `Hello ${params.displayName.trim() || 'Staff Member'},`,
    ``,
    `Welcome to ReuseFlow (v1.0.0) — the Smart Refurbishment Decision Engine.`,
    `Your personal staff account has been created and provisioned with your own isolated device triage workspace.`,
    ``,
    `Account Summary:`,
    `- Display Name: ${params.displayName.trim()}`,
    `- Email: ${recipient}`,
    `- Department: ${params.department.trim()}`,
    `- Title: ${params.jobTitle.trim()}`,
    `- Security Role: ${params.role.toUpperCase()}`,
    ``,
    `What is ready in your separate account:`,
    `1. Isolated Device Queue: 6 starter benchmark devices (FG-DEMO-101 to FG-DEMO-106) and any new devices you intake are stored exclusively in your account.`,
    `2. Personal Scenario Lab & Engine Settings: Customize hourly labor rates, minimum margin thresholds, and RAM heuristics for your workspace.`,
    `3. Profile & Security Controls: Update your profile details or change your password anytime from the 'My Profile' tab.`,
    ``,
    `Open your workspace: ${appLink}`,
    ``,
    `— ReuseFlow Operations Team`,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1D1D1F;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#FFFFFF;border:1px solid #E5E5EA;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #E5E5EA;background-color:#FAFAFC;">
                <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4F46E5;background-color:#EEF2FF;padding:4px 10px;border-radius:999px;">
                  ReuseFlow v1.0.0 · Account Provisioned
                </span>
                <h1 style="margin:12px 0 4px;font-size:22px;font-weight:700;color:#1D1D1F;">
                  Welcome to ReuseFlow, ${safeName}!
                </h1>
                <p style="margin:0;font-size:13px;color:#6E6E73;">
                  Smart Refurbishment Decision Engine · Isolated Staff Account
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#1D1D1F;">
                <p style="margin:0 0 16px;">
                  Your ReuseFlow account is active and your <strong>separate personal workspace</strong> has been provisioned in Supabase Postgres with Row-Level Security (RLS).
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F7;border:1px solid #E5E5EA;border-radius:12px;padding:16px;margin-bottom:20px;font-size:13px;">
                  <tr>
                    <td style="padding:4px 0;color:#6E6E73;">Display Name</td>
                    <td style="padding:4px 0;font-weight:600;text-align:right;color:#1D1D1F;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6E6E73;">Account Email</td>
                    <td style="padding:4px 0;font-family:monospace;text-align:right;color:#1D1D1F;">${escapeHtml(recipient)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6E6E73;">Department &amp; Title</td>
                    <td style="padding:4px 0;text-align:right;color:#1D1D1F;">${safeDept} · ${safeTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6E6E73;">Assigned Role</td>
                    <td style="padding:4px 0;font-family:monospace;font-weight:600;text-align:right;color:#10B981;">${safeRole}</td>
                  </tr>
                </table>
                <p style="margin:0 0 20px;font-size:13px;color:#6E6E73;">
                  All devices you intake, assessments you run, Scenario Lab thresholds you save, and profile updates are stored in your own dedicated account.
                </p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${appLink}" style="display:inline-block;background-color:#6366F1;color:#FFFFFF;font-weight:600;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;">
                    Open Your ReuseFlow Workspace (/app) →
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #E5E5EA;background-color:#FAFAFC;font-size:11px;color:#86868B;">
                ReuseFlow · FUSE Society Blueprint 2026 Prototype · Sent via Resend
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    const resend = new Resend(apiKey);
    const res = await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject,
      text,
      html,
    });
    if (res.error) {
      return { ok: false, message: res.error.message };
    }
    return { ok: true, providerId: res.data?.id ?? 'resend-welcome' };
  } catch {
    return { ok: false, message: 'Failed to send welcome email.' };
  }
}

export async function sendPasswordResetCodeEmail(params: {
  email: string;
  displayName: string;
  code: string;
}): Promise<{ ok: boolean; providerId?: string; message?: string }> {
  const { apiKey, fromEmail, siteUrl } = getResendConfig();
  if (!apiKey) {
    return {
      ok: false,
      message: 'RESEND_API_KEY is not configured in this environment.',
    };
  }

  const recipient = params.email.trim().toLowerCase();
  const safeName = escapeHtml(params.displayName.trim() || 'Staff Member');
  const safeCode = escapeHtml(params.code.trim());
  const resetUrl = `${siteUrl}/login?mode=reset&email=${encodeURIComponent(
    recipient
  )}&code=${encodeURIComponent(params.code.trim())}`;

  const subject = `${params.code.trim()} is your ReuseFlow password recovery code`;
  const text = [
    `Hello ${params.displayName.trim() || 'Staff Member'},`,
    ``,
    `We received a request to reset the password for your ReuseFlow account (${recipient}).`,
    ``,
    `Your 6-Digit Recovery Code (valid for 15 minutes):`,
    `${params.code.trim()}`,
    ``,
    `Or click the direct recovery link below to open the password reset form with your code pre-filled:`,
    `${resetUrl}`,
    ``,
    `If you did not request a password reset, you can safely ignore this email.`,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1D1D1F;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#FFFFFF;border:1px solid #E5E5EA;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #E5E5EA;background-color:#FAFAFC;">
                <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#B45309;background-color:#FEF3C7;padding:4px 10px;border-radius:999px;">
                  Password Recovery Request
                </span>
                <h1 style="margin:12px 0 4px;font-size:20px;font-weight:700;color:#1D1D1F;">
                  Reset Your ReuseFlow Password
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#1D1D1F;">
                <p style="margin:0 0 16px;">
                  Hello <strong>${safeName}</strong>, use the 6-digit recovery code below to set a new password for <code style="font-family:monospace;">${escapeHtml(recipient)}</code>. This code expires in <strong>15 minutes</strong>.
                </p>
                <div style="background-color:#F5F5F7;border:1px solid #E5E5EA;border-radius:12px;padding:18px;text-align:center;margin:20px 0;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6E6E73;margin-bottom:6px;">
                    6-Digit Verification Code
                  </div>
                  <div style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:0.22em;color:#4F46E5;">
                    ${safeCode}
                  </div>
                </div>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background-color:#6366F1;color:#FFFFFF;font-weight:600;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;">
                    Reset Password in 1 Click →
                  </a>
                </div>
                <p style="margin:0;font-size:12px;color:#86868B;">
                  If you did not request this password reset, no changes have been made to your account.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    const resend = new Resend(apiKey);
    const res = await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject,
      text,
      html,
    });
    if (res.error) {
      return { ok: false, message: res.error.message };
    }
    return { ok: true, providerId: res.data?.id ?? 'resend-reset-code' };
  } catch {
    return { ok: false, message: 'Failed to send password recovery email.' };
  }
}

export async function sendPasswordChangedNoticeEmail(params: {
  email: string;
  displayName: string;
}): Promise<{ ok: boolean }> {
  const { apiKey, fromEmail, siteUrl } = getResendConfig();
  if (!apiKey) return { ok: false };

  const recipient = params.email.trim().toLowerCase();
  const safeName = escapeHtml(params.displayName.trim() || 'Staff Member');

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject: `ReuseFlow Security Notice — Your Password Was Updated`,
      text: `Hello ${params.displayName.trim() || 'Staff Member'},\n\nThe password for your ReuseFlow account (${recipient}) was just updated.\n\nSign in at: ${siteUrl}/login`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;color:#1D1D1F;">
        <h2 style="margin:0 0 8px;">Your ReuseFlow Password Was Updated</h2>
        <p style="color:#6E6E73;font-size:14px;">Hello <strong>${safeName}</strong>, the password for your account (<code>${escapeHtml(recipient)}</code>) was successfully updated.</p>
        <p style="font-size:13px;"><a href="${siteUrl}/login" style="color:#6366F1;">Open ReuseFlow Sign In →</a></p>
      </div>`,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
