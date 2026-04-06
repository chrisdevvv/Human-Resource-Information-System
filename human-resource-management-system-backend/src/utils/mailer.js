require("../config/loadEnv");
const nodemailer = require("nodemailer");

// ---------------------------------------------------------------------------
// Transporter — configured via .env (see README for required vars)
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || "DepEd HRIS <noreply@deped.gov.ph>";
const FRONTEND_URL =
  process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3001";
const RESET_LINK_LABEL =
  process.env.RESET_PASSWORD_TOKEN_TTL_LABEL || "2 hours";

// Only attempt to send if all SMTP vars are present
const SMTP_READY = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

// ---------------------------------------------------------------------------
// Core send helper — fire-and-forget safe; logs but never throws
// ---------------------------------------------------------------------------
async function sendMail({ to, subject, html }) {
  if (!SMTP_READY) {
    console.warn(
      `[mailer] SMTP not configured — skipped email to ${to}: "${subject}"`,
    );
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[mailer] Sent "${subject}" → ${to}`);
  } catch (err) {
    console.error(
      `[mailer] Failed to send "${subject}" to ${to}:`,
      err.message,
    );
  }
}

// ---------------------------------------------------------------------------
// Shared HTML wrapper
// ---------------------------------------------------------------------------
function baseTemplate(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Poppins,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header with Logos -->
        <tr>
          <td style="background:#1d4ed8;padding:24px 32px;">
            <!-- Logos -->
            <div style="text-align:center;margin-bottom:16px;">
              <img src="${FRONTEND_URL}/sdologo-new.svg" alt="SD Logo" style="height:80px;width:auto;margin:0 12px;vertical-align:middle;display:inline-block;" />
            </div>
            <p style="margin:0;font-size:11px;color:#bfdbfe;letter-spacing:2px;text-transform:uppercase;text-align:center;">
              Department of Education
            </p>
            <h1 style="margin:4px 0 0;font-size:20px;color:#ffffff;text-align:center;">
              Human Resource Information System
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyContent}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              This is an automated message from DepEd HRIS. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Role display helper
// ---------------------------------------------------------------------------
function roleLabel(role) {
  const raw = String(role || "").trim();
  const normalized = raw.toUpperCase().replace(/\s+/g, "_");

  if (normalized === "SUPER_ADMIN") return "Super Admin";
  if (normalized === "ADMIN") return "Admin";
  if (normalized === "DATA_ENCODER") return "Data Encoder";

  if (!raw) return "User";

  // Fallback prettifier for unknown role strings.
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Email: Registration request received (sent to user on sign-up)
// ---------------------------------------------------------------------------
async function sendRegistrationReceived(to, firstName) {
  const html = baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Hi ${firstName},</h2>
        <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
            We have received your registration request for the
            <strong>DepEd Human Resource Information System</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Your request is currently <strong>pending review</strong> by a system administrator.
            You will receive another email once your account has been approved or if further
            action is required.
        </p>
        <div style="background:#eff6ff;border-left:4px solid #1d4ed8;padding:14px 18px;
                    border-radius:4px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#1e40af;">
                Please allow up to <strong>1–3 business days</strong> for review.
                Do not submit another registration request in the meantime.
            </p>
        </div>
        <p style="margin:0;font-size:14px;color:#6b7280;">
            If you did not make this request, please disregard this email.
        </p>
    `);

  await sendMail({
    to,
    subject: "Registration Request Received — DepEd HRIS",
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Registration approved (sent to user when super admin approves)
// ---------------------------------------------------------------------------
async function sendRegistrationApproved(to, firstName, role) {
  const html = baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Hi ${firstName},</h2>
        <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
            Great news! Your registration request has been
            <strong style="color:#16a34a;">approved</strong>.
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
            Your account has been created with the following role:
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px 20px;
                    border-radius:6px;margin-bottom:24px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#166534;text-transform:uppercase;
                      letter-spacing:1px;">Assigned Role</p>
            <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:#15803d;">
                ${roleLabel(role)}
            </p>
        </div>
        <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
            You can now sign in using your registered email address and the password you set
            during registration.
        </p>
        <div style="text-align:center;">
          <a href="${FRONTEND_URL}/login"
               style="display:inline-block;background:#1d4ed8;color:#ffffff;
                      padding:12px 32px;border-radius:6px;text-decoration:none;
                      font-size:15px;font-weight:600;">
                Sign In Now
            </a>
        </div>
    `);

  await sendMail({
    to,
    subject: "Registration Approved — Welcome to DepEd HRIS",
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Registration rejected (sent to user when super admin rejects)
// ---------------------------------------------------------------------------
async function sendRegistrationRejected(to, firstName, reason) {
  const reasonBlock = reason
    ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;
                       border-radius:4px;margin-bottom:24px;">
               <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#991b1b;">
                   Reason provided:
               </p>
               <p style="margin:0;font-size:14px;color:#7f1d1d;">${reason}</p>
           </div>`
    : "";

  const html = baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Hi ${firstName},</h2>
        <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
            We regret to inform you that your registration request for the
            <strong>DepEd Human Resource Information System</strong> has been
            <strong style="color:#dc2626;">rejected</strong>.
        </p>
        ${reasonBlock}
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            If you believe this is an error, please contact your school administrator
            or the DepEd CSJDM ICT Unit directly for assistance.
        </p>
        <p style="margin:0;font-size:14px;color:#6b7280;">
            If you did not make this request, please disregard this email.
        </p>
    `);

  await sendMail({
    to,
    subject: "Registration Request Update — DepEd HRIS",
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Password reset link (sent to user on forgot-password request)
// ---------------------------------------------------------------------------
async function sendPasswordResetLink(to, firstName, resetLink) {
  const html = baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Hi ${firstName},</h2>
        <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
            We received a request to reset the password for your
            <strong>DepEd Human Resource Information System</strong> account.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
          Click the button below to reset your password. This link is valid for
          <strong>${RESET_LINK_LABEL}</strong>.
        </p>
        <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetLink}"
               style="display:inline-block;background:#1d4ed8;color:#ffffff;
                      padding:14px 36px;border-radius:6px;text-decoration:none;
                      font-size:15px;font-weight:600;">
                Reset My Password
            </a>
        </div>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px;font-size:12px;color:#1d4ed8;word-break:break-all;">
            ${resetLink}
        </p>
        <div style="background:#fef9c3;border-left:4px solid #ca8a04;padding:14px 18px;
                    border-radius:4px;">
            <p style="margin:0;font-size:14px;color:#854d0e;">
                <strong>Didn't request this?</strong> You can safely ignore this email.
                Your password will not be changed.
            </p>
        </div>
    `);

  await sendMail({
    to,
    subject: "Reset Your Password \u2014 DepEd HRIS",
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Password changed (sent to user whenever their password is updated)
// ---------------------------------------------------------------------------
async function sendPasswordChanged(to, firstName) {
  const html = baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Hi ${firstName},</h2>
        <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
            This is a confirmation that the password for your
            <strong>DepEd Human Resource Information System</strong> account has been
            <strong>successfully changed</strong>.
        </p>
        <div style="background:#fef9c3;border-left:4px solid #ca8a04;padding:14px 18px;
                    border-radius:4px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#854d0e;">
                <strong>If you did not make this change</strong>, your account may have been
                accessed without your permission. Please contact your system administrator
                immediately.
            </p>
        </div>
        <div style="text-align:center;">
          <a href="${FRONTEND_URL}/login"
               style="display:inline-block;background:#1d4ed8;color:#ffffff;
                      padding:12px 32px;border-radius:6px;text-decoration:none;
                      font-size:15px;font-weight:600;">
                Sign In
            </a>
        </div>
    `);

  await sendMail({
    to,
    subject: "Your Password Has Been Changed \u2014 DepEd HRIS",
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Role changed (sent to user when super admin changes their role)
// ---------------------------------------------------------------------------
async function sendRoleChanged(to, firstName, oldRole, newRole) {
  const html = baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Hi ${firstName},</h2>
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
            Your account role in the <strong>DepEd Human Resource Information System</strong>
            has been updated by a system administrator.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td width="48%" style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;
                                   padding:16px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:#6b7280;text-transform:uppercase;
                        letter-spacing:1px;">Previous Role</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#6b7280;">${roleLabel(oldRole)}</p>
            </td>
            <td width="4%" style="text-align:center;color:#9ca3af;font-size:20px;">→</td>
            <td width="48%" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;
                                   padding:16px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:#1e40af;text-transform:uppercase;
                        letter-spacing:1px;">New Role</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#1d4ed8;">${roleLabel(newRole)}</p>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Your access and permissions within the system have been updated accordingly.
            Please sign out and sign back in for the changes to take full effect.
        </p>
        <div style="text-align:center;">
          <a href="${FRONTEND_URL}/login"
               style="display:inline-block;background:#1d4ed8;color:#ffffff;
                      padding:12px 32px;border-radius:6px;text-decoration:none;
                      font-size:15px;font-weight:600;">
                Sign In
            </a>
        </div>
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
            If you did not expect this change, please contact your system administrator immediately.
        </p>
    `);

  await sendMail({
    to,
    subject: "Your Account Role Has Been Updated — DepEd HRIS",
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Account created by admin/super admin (with initial credentials)
// ---------------------------------------------------------------------------
async function sendAccountCreatedCredentials(
  to,
  firstName,
  role,
  email,
  temporaryPassword,
) {
  const html = baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Hi ${firstName},</h2>
        <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
            Your account has been created in the
            <strong>DepEd Human Resource Information System</strong> by a system administrator.
        </p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:16px 20px;
                    border-radius:6px;margin:16px 0 20px;">
            <p style="margin:0 0 6px;font-size:12px;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">
                Assigned Role
            </p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#1d4ed8;">${roleLabel(role)}</p>
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px 20px;
                    border-radius:6px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Sign-in Credentials</p>
            <p style="margin:0 0 6px;font-size:14px;color:#111827;"><strong>Email:</strong> ${email}</p>
            <p style="margin:0;font-size:14px;color:#111827;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        </div>
        <div style="background:#fef9c3;border-left:4px solid #ca8a04;padding:14px 18px;
                    border-radius:4px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#854d0e;line-height:1.6;">
                For your security, please sign in and <strong>change your password immediately</strong>.
            </p>
        </div>
        <div style="text-align:center;">
          <a href="${FRONTEND_URL}/login"
               style="display:inline-block;background:#1d4ed8;color:#ffffff;
                      padding:12px 32px;border-radius:6px;text-decoration:none;
                      font-size:15px;font-weight:600;">
                Sign In Now
            </a>
        </div>
    `);

  await sendMail({
    to,
    subject: "Your Account Credentials — DepEd HRIS",
    html,
  });
}

module.exports = {
  sendRegistrationReceived,
  sendRegistrationApproved,
  sendRegistrationRejected,
  sendPasswordResetLink,
  sendPasswordChanged,
  sendRoleChanged,
  sendAccountCreatedCredentials,
};
