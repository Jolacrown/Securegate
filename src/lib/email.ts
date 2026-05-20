import { Resend } from "resend";
import nodemailer from "nodemailer";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM || "SecureGate <onboarding@resend.dev>";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

let transporter: nodemailer.Transporter | null = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

if (!resend && !transporter) {
  console.warn(
    "\n\u26A0\uFE0F  No email provider configured. Emails will be logged to console instead of sent.\n" +
      "   Set RESEND_API_KEY or SMTP credentials in .env.local to enable email sending.\n"
  );
} else if (resend) {
  console.log(
    "\u2705  Resend client initialized (from: " + EMAIL_FROM + ")\n" +
    "   Make sure the domain in EMAIL_FROM is verified in your Resend dashboard.\n"
  );
} else if (transporter) {
  console.log("\u2705  Nodemailer client initialized (SMTP)\n");
}

interface SendResetEmailParams {
  to: string;
  resetUrl: string;
}

interface SendVerificationEmailParams {
  to: string;
  verifyUrl: string;
}

function logDevEmail(type: string, to: string, url: string) {
  console.log("\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  console.log(`\uD83D\uDCE7 ${type} (dev mode)`);
  console.log(`   To:   ${to}`);
  console.log(`   Link: ${url}`);
  console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendResetEmailParams): Promise<void> {
  const subject = "Reset your password \u2014 SecureGate";
  const text = `Reset your password\n\nYou requested a password reset for your SecureGate account. Click the link below to set a new password. This link expires in 30 minutes.\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`;
  const html = emailTemplate({
    title: "Reset your password",
    body: "You requested a password reset for your SecureGate account. Click the button below to set a new password. This link expires in 30 minutes.",
    buttonLabel: "Reset Password",
    buttonUrl: resetUrl,
    footer: "If you did not request this, you can safely ignore this email.",
  });

  if (resend) {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Resend API error (password reset):", error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  } else if (transporter) {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });
    } catch (error: any) {
      console.error("Nodemailer error (password reset):", error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  } else {
    logDevEmail("PASSWORD RESET EMAIL", to, resetUrl);
  }
}

export async function sendVerificationEmail({
  to,
  verifyUrl,
}: SendVerificationEmailParams): Promise<void> {
  const subject = "Verify your email \u2014 SecureGate";
  const text = `Verify your email address\n\nThanks for creating a SecureGate account. Click the link below to verify your email address. This link expires in 15 minutes.\n\n${verifyUrl}\n\nIf you did not create an account, you can safely ignore this email.`;
  const html = emailTemplate({
    title: "Verify your email address",
    body: "Thanks for creating a SecureGate account. Click the button below to verify your email address. This link expires in 15 minutes.",
    buttonLabel: "Verify Email",
    buttonUrl: verifyUrl,
    footer: "If you did not create an account, you can safely ignore this email.",
  });

  if (resend) {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Resend API error (verification):", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  } else if (transporter) {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });
    } catch (error: any) {
      console.error("Nodemailer error (verification):", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  } else {
    logDevEmail("VERIFICATION EMAIL", to, verifyUrl);
  }
}

function emailTemplate({
  title,
  body,
  buttonLabel,
  buttonUrl,
  footer,
}: {
  title: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:8px;">
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a1a;">${title}</h1>
              <p style="margin:0 0 24px;font-size:16px;color:#555555;line-height:1.5;">${body}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="background-color:#2d7d85;border-radius:6px;">
                    <a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-size:16px;color:#ffffff;text-decoration:none;font-weight:600;letter-spacing:0.3px;">${buttonLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;color:#888888;line-height:1.5;">${footer}</p>
              <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;word-break:break-all;">If the button doesn't work, copy and paste this URL into your browser:<br><a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" style="color:#2d7d85;">${buttonUrl}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
