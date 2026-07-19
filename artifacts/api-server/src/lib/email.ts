import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP2GO_HOST || "mail.smtp2go.com",
  port: parseInt(process.env.SMTP2GO_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP2GO_USERNAME,
    pass: process.env.SMTP2GO_PASSWORD,
  },
});

const FROM = `${process.env.SMTP_FROM_NAME || "نظام ثناره الطبي"} <${process.env.SMTP_FROM_EMAIL || "noreply@thanarh.com"}>`;

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    await transporter.sendMail({ from: FROM, ...opts });
    logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
  } catch (err) {
    logger.error({ err, to: opts.to }, "Failed to send email");
    // Don't throw — email failures should not block the response in most cases
  }
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #F7F5F1; margin: 0; padding: 0; direction: rtl; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0F3D33; padding: 32px; text-align: center; }
    .header img { width: 160px; }
    .header h1 { color: #A9CBB5; font-size: 14px; margin: 12px 0 0; font-weight: 400; letter-spacing: 2px; }
    .body { padding: 40px 48px; color: #1A1A1A; line-height: 1.7; font-size: 15px; }
    .btn { display: inline-block; background: #1E6B4D; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; font-size: 15px; }
    .footer { background: #F7F5F1; padding: 20px 48px; text-align: center; color: #6B7280; font-size: 12px; border-top: 1px solid #e8e6e1; }
    .divider { height: 1px; background: #e8e6e1; margin: 24px 0; }
    .label { color: #1E6B4D; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="color:#A9CBB5; font-size: 28px; font-weight: 700; letter-spacing: 1px;">ثناره</div>
      <h1>THANARAH</h1>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>هذا البريد مرسل من نظام ثناره الطبي</p>
      <p>ثناره — تقنية تخدم الإنسان</p>
      <p style="color:#0F3D33; font-size: 10px;">© 2026 Thanarah Team. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendInvitationEmail(opts: {
  to: string;
  inviteeName: string;
  inviteUrl: string;
  expiresAt: Date;
  inviterName: string;
  customMessage?: string;
}): Promise<void> {
  const html = baseTemplate(`
    <p>مرحباً <span class="label">${opts.inviteeName}</span>،</p>
    <p>تمت دعوتك من قِبل <span class="label">${opts.inviterName}</span> للاطلاع على رؤية ومنظومة مشروع <strong>ثناره</strong> الطبي الشاملة.</p>
    ${opts.customMessage ? `<p>${opts.customMessage}</p>` : ""}
    <div class="divider"></div>
    <p>الدعوة سارية حتى: <span class="label">${opts.expiresAt.toLocaleDateString("ar-SA")}</span></p>
    <p>انقر على الزر أدناه لقبول الدعوة وإنشاء حسابك:</p>
    <center><a href="${opts.inviteUrl}" class="btn">قبول الدعوة</a></center>
    <div class="divider"></div>
    <p style="font-size: 13px; color: #6B7280;">هذه الجلسة مخصصة لك ومحمية بعلامة تعريف رقمية. يُرجى عدم مشاركة الرابط.</p>
  `);

  await sendEmail({
    to: opts.to,
    subject: "دعوة للاطلاع على منظومة ثناره الطبية",
    html,
  });
}

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const html = baseTemplate(`
    <p>مرحباً <span class="label">${opts.name}</span>،</p>
    <p>رمز التحقق من بريدك الإلكتروني هو:</p>
    <center>
      <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0F3D33; background: #F7F5F1; padding: 24px 40px; border-radius: 8px; display: inline-block; margin: 16px 0;">${opts.code}</div>
    </center>
    <p>الرمز صالح لمدة 10 دقائق.</p>
  `);

  await sendEmail({ to: opts.to, subject: "رمز التحقق - ثناره", html });
}

export async function sendLoginAlertEmail(opts: {
  to: string;
  name: string;
  ipAddress: string;
  country?: string;
  device: string;
  time: Date;
}): Promise<void> {
  const html = baseTemplate(`
    <p>مرحباً <span class="label">${opts.name}</span>،</p>
    <p>تم تسجيل الدخول إلى حسابك في ثناره من:</p>
    <ul style="margin: 16px 0; padding-right: 20px;">
      <li>الجهاز: ${opts.device}</li>
      <li>العنوان: ${opts.ipAddress}${opts.country ? ` (${opts.country})` : ""}</li>
      <li>الوقت: ${opts.time.toLocaleString("ar-SA")}</li>
    </ul>
    <p>إذا لم تكن أنت، تواصل مع المسؤول فوراً.</p>
  `);

  await sendEmail({ to: opts.to, subject: "تنبيه: تسجيل دخول جديد - ثناره", html });
}

export async function sendVisitRequestConfirmation(opts: {
  to: string;
  name: string;
}): Promise<void> {
  const html = baseTemplate(`
    <p>مرحباً <span class="label">${opts.name}</span>،</p>
    <p>تم استلام طلب زيارتك لمنظومة ثناره الطبية بنجاح.</p>
    <p>سيتم مراجعة طلبك والتواصل معك في أقرب وقت ممكن.</p>
    <p>شكراً لاهتمامك بثناره.</p>
  `);

  await sendEmail({ to: opts.to, subject: "تأكيد استلام طلب الزيارة - ثناره", html });
}

export async function sendVisitRequestAdminNotification(opts: {
  to: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  reason: string;
  visitorType: string;
}): Promise<void> {
  const html = baseTemplate(`
    <p>طلب زيارة جديد في نظام ثناره:</p>
    <ul style="margin: 16px 0; padding-right: 20px;">
      <li>الاسم: <span class="label">${opts.visitorName}</span></li>
      <li>البريد: ${opts.visitorEmail}</li>
      <li>الجوال: ${opts.visitorPhone}</li>
      <li>النوع: ${opts.visitorType}</li>
      <li>السبب: ${opts.reason}</li>
    </ul>
    <p>يمكنك الموافقة أو رفض الطلب من لوحة التحكم.</p>
  `);

  await sendEmail({ to: opts.to, subject: `طلب زيارة جديد - ${opts.visitorName}`, html });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const html = baseTemplate(`
    <p>مرحباً <span class="label">${opts.name}</span>،</p>
    <p>طلبت إعادة تعيين كلمة المرور. انقر على الزر أدناه:</p>
    <center><a href="${opts.resetUrl}" class="btn">إعادة تعيين كلمة المرور</a></center>
    <p>الرابط صالح لمدة 30 دقيقة. إذا لم تطلب ذلك، تجاهل هذا البريد.</p>
  `);

  await sendEmail({ to: opts.to, subject: "إعادة تعيين كلمة المرور - ثناره", html });
}
