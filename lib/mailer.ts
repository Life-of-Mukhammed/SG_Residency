import nodemailer from 'nodemailer';

export type NotificationMailInput = {
  to: string;
  subject: string;
  title: string;
  message: string;
  type?: 'meeting' | 'report' | 'info';
};

function getSmtpConfig() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  return { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom };
}

function getTransporter() {
  const { smtpHost, smtpPort, smtpUser, smtpPass } = getSmtpConfig();
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM to env.');
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

const TYPE_META: Record<string, { icon: string; accent: string; label: string }> = {
  meeting: { icon: '🗓', accent: '#6366f1', label: 'Meeting' },
  report:  { icon: '📊', accent: '#10b981', label: 'Report'  },
  info:    { icon: '🔔', accent: '#f59e0b', label: 'Update'  },
};

function buildEmailHtml(title: string, message: string, type?: string): string {
  const meta = TYPE_META[type ?? 'info'] ?? TYPE_META.info;
  const messageHtml = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px 16px 0 0;padding:32px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:36px;text-align:center;">🚀</div>
                      <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;vertical-align:middle;margin-left:10px;">Startup Garage</span>
                    </div>
                    <p style="margin:14px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Residency Management Platform</p>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <div style="background:rgba(255,255,255,0.15);border-radius:20px;padding:6px 14px;display:inline-block;">
                      <span style="font-size:13px;color:#ffffff;font-weight:500;">${meta.icon} ${meta.label}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 32px;">

              <!-- Title -->
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
                ${title}
              </h1>

              <!-- Divider -->
              <div style="height:3px;background:linear-gradient(90deg,${meta.accent},transparent);border-radius:2px;margin-bottom:24px;"></div>

              <!-- Message box -->
              <div style="background:#f8fafc;border-left:4px solid ${meta.accent};border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0;font-size:15px;color:#334155;line-height:1.8;">
                  ${messageHtml}
                </p>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;">
                    <a href="${process.env.NEXTAUTH_URL || 'https://residency.startupgarage.uz'}/dashboard"
                       style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                      Open Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:20px 40px;border-radius:0 0 4px 4px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                      Need help? Contact support on Telegram:
                      <a href="https://t.me/Life_of_muhammed"
                         style="color:#6366f1;font-weight:600;text-decoration:none;">@Life_of_muhammed</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
                © ${new Date().getFullYear()} Startup Garage · Residency Platform<br>
                You are receiving this because you have a manager or admin role.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetCode(email: string, code: string) {
  const { smtpFrom } = getSmtpConfig();
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Startup Garage" <${smtpFrom}>`,
    to: email,
    subject: 'Startup Garage — password reset code',
    text: `Your password reset code is ${code}. It expires in 10 minutes.`,
    html: buildEmailHtml(
      'Password Reset Code',
      `You requested a password reset for your Startup Garage account.\n\nYour code: <strong style="font-size:28px;letter-spacing:6px;color:#6366f1;">${code}</strong>\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`,
      'info'
    ),
  });
}

export async function sendNotificationEmail(input: NotificationMailInput) {
  try {
    const { smtpFrom } = getSmtpConfig();
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Startup Garage" <${smtpFrom}>`,
      to: input.to,
      subject: `Startup Garage — ${input.subject}`,
      text: `${input.title}\n\n${input.message}`,
      html: buildEmailHtml(input.title, input.message, input.type),
    });
  } catch (error) {
    console.error('[Mailer] notification email failed:', error);
  }
}
