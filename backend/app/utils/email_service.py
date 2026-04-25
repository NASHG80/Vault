"""
utils/email_service.py
Sends transactional emails via fastapi-mail (Gmail SMTP).
Config is built lazily so missing credentials don't crash startup.
"""

from pydantic import SecretStr
from app.config import MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, MAIL_PORT, MAIL_SERVER

_fm = None  # lazily initialised FastMail instance


def _get_fm():
    """Build FastMail instance on first use (avoids startup crash if creds missing)."""
    global _fm
    if _fm is not None:
        return _fm

    # Import here to avoid Pydantic issues at module level
    from fastapi_mail import FastMail, ConnectionConfig

    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=SecretStr(MAIL_PASSWORD),
        MAIL_FROM=MAIL_FROM or MAIL_USERNAME,
        MAIL_PORT=MAIL_PORT,
        MAIL_SERVER=MAIL_SERVER,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )
    _fm = FastMail(conf)
    return _fm


async def send_otp_email(email: str, otp: str):
    """Send a stylised OTP email. Silently skips if mail credentials are not set."""
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print(f"[email_service] ⚠️  Mail not configured — skipping email to {email}. OTP: {otp}")
        return

    from fastapi_mail import MessageSchema, MessageType

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#f4f7ff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7ff;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">GigTrust</h1>
                  <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">Email Verification</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="color:#374151;font-size:16px;margin:0 0 24px;">
                    Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.
                  </p>
                  <div style="background:#f0f0ff;border:2px dashed #4f46e5;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
                    <span style="font-size:48px;font-weight:800;letter-spacing:12px;color:#4f46e5;font-family:monospace;">
                      {otp}
                    </span>
                  </div>
                  <p style="color:#6b7280;font-size:13px;margin:0;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; 2025 GigTrust. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Your GigTrust Verification Code",
        recipients=[email],
        body=html,
        subtype=MessageType.html,
    )

    await _get_fm().send_message(message)
