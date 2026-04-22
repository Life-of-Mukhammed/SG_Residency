import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

function getTransporter() {
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP is not configured. Please add SMTP_USER and SMTP_PASS to .env.local');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendPasswordResetCode(email: string, code: string) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: 'Startup Residency password reset code',
    text: `Your password reset code is ${code}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 12px; color: #0f172a;">Password reset code</h2>
        <p style="margin: 0 0 16px; color: #475569; line-height: 1.6;">
          You requested to reset your password for Startup Residency.
        </p>
        <div style="margin: 20px 0; padding: 18px; border-radius: 16px; background: #eff6ff; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8;">${code}</div>
        </div>
        <p style="margin: 0; color: #475569; line-height: 1.6;">
          This code expires in 10 minutes. If you did not request this, you can ignore this email.
        </p>
      </div>
    `,
  });
}
