"""
routes/whatsapp.py
WhatsApp notification system (outbound only — no webhook needed).

All WhatsApp messages are triggered by events:
  1. Worker Login   → "Please enter your latest transactions"  (auth.py)
  2. Job Request    → "You got a request from [hirer] for [job]"  (requests.py)
  3. Hourly Reminder → sent to all registered workers  (APScheduler in main.py)

This route file provides a health-check and manual test endpoint.
"""

from fastapi import APIRouter
from app.services.whatsapp_service import send_whatsapp

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


@router.get("/status")
def whatsapp_status():
    """Check if WhatsApp notification system is configured."""
    from app.config import TWILIO_ACCOUNT_SID, TWILIO_WHATSAPP_NUMBER
    return {
        "enabled": bool(TWILIO_ACCOUNT_SID),
        "whatsapp_from": TWILIO_WHATSAPP_NUMBER if TWILIO_ACCOUNT_SID else "not configured",
        "mode": "outbound-only (no webhook)",
        "triggers": [
            "Worker Login → transaction reminder",
            "New Job Request → job alert with hirer name",
            "Every 1 hour → reminder to all workers",
        ],
    }


@router.post("/test-send")
def test_send(phone: str, message: str = "🔔 Test message from GigTrust WhatsApp bot!"):
    """
    Manual test endpoint — send a WhatsApp message.
    Example: POST /whatsapp/test-send?phone=+919579601589
    """
    success = send_whatsapp(phone, message)
    return {
        "sent": success,
        "to": phone,
        "message": message,
    }
