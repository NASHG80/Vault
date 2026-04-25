"""
services/whatsapp_service.py
Reusable Twilio WhatsApp sender.
Confirmed working with Twilio Sandbox (whatsapp:+14155238886).
"""

from app.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER


def send_whatsapp(to_phone: str, message: str) -> bool:
    """
    Send a WhatsApp message via Twilio.
    `to_phone` should be E.164 format, e.g. "+919579601589".
    Automatically prepends "whatsapp:" if not already there.
    Returns True on success, False on failure.
    """
    # Ensure whatsapp: prefix
    if not to_phone.startswith("whatsapp:"):
        to_phone = f"whatsapp:{to_phone}"

    # Truncate to WhatsApp-friendly length
    if len(message) > 1500:
        message = message[:1497] + "..."

    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        try:
            from twilio.rest import Client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            msg = client.messages.create(
                body=message,
                from_=TWILIO_WHATSAPP_NUMBER,
                to=to_phone,
            )
            print(f"[WhatsApp] ✅ Sent to {to_phone} | SID: {msg.sid}")
            return True
        except Exception as e:
            print(f"[WhatsApp] ❌ Error sending to {to_phone}: {e}")
            return False
    else:
        # Dev fallback — print to console
        print(f"[WhatsApp] 📱 DEV MODE — To: {to_phone}")
        print(f"[WhatsApp] Message:\n{message}\n")
        return True
