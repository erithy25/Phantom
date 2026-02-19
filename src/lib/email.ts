import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Phantom <noreply@resend.dev>";

export async function sendVerificationEmail(email: string, code: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${code} – Your Phantom Verification Code`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background-color:#141414;border-radius:16px;border:1px solid #262626;overflow:hidden;">
          <tr>
            <td style="padding:40px 36px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                👻 Phantom
              </h1>
              <p style="margin:0;font-size:14px;color:#737373;">
                Verify your email to get started
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 36px;">
              <p style="margin:0 0 20px;font-size:15px;color:#a3a3a3;line-height:1.6;">
                Enter this code to verify your email address:
              </p>
              <div style="background-color:#1a1a2e;border:1px solid #2d2d5e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#ffffff;font-family:'Courier New',monospace;">
                  ${code}
                </span>
              </div>
              <p style="margin:0;font-size:13px;color:#525252;line-height:1.5;">
                This code expires in <strong style="color:#737373;">10 minutes</strong>. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:12px;color:#404040;text-align:center;">
                Phantom – Anonymous University Community
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
    console.log(`[PHANTOM] Verification email sent to ${email}`);
  } catch (error) {
    console.error(`[PHANTOM] Failed to send verification email to ${email}:`, error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset Your Phantom Password",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background-color:#141414;border-radius:16px;border:1px solid #262626;overflow:hidden;">
          <tr>
            <td style="padding:40px 36px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                👻 Phantom
              </h1>
              <p style="margin:0;font-size:14px;color:#737373;">
                Password reset request
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 36px;">
              <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;line-height:1.6;">
                We received a request to reset your password. Click the button below to choose a new password:
              </p>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${resetUrl}" style="display:inline-block;background-color:#6d28d9;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 16px;font-size:13px;color:#525252;line-height:1.5;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#6d28d9;word-break:break-all;line-height:1.5;">
                ${resetUrl}
              </p>
              <p style="margin:0;font-size:13px;color:#525252;line-height:1.5;">
                This link expires in <strong style="color:#737373;">1 hour</strong>. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:12px;color:#404040;text-align:center;">
                Phantom – Anonymous University Community
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
    console.log(`[PHANTOM] Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`[PHANTOM] Failed to send password reset email to ${email}:`, error);
    throw new Error("Failed to send password reset email");
  }
}
