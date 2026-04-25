"""
routes/kyc_manual.py
Manual KYC OTP flow via Twilio SMS:
  POST /kyc/send-otp    — generate OTP and send via Twilio to +91<phone>
  POST /kyc/verify-otp  — validate OTP, return { verified: true/false }

Twilio trial note:
  - OTP will only be delivered to numbers added as Verified Caller IDs
    in your Twilio console.
  - If TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set, the OTP
    falls back to console-print mode (useful in local dev).
"""

import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER

router = APIRouter(prefix="/kyc", tags=["KYC"])

# In-memory OTP store: { phone_digits: otp }
# Acceptable for demo — resets on server restart.
_otp_store: dict[str, str] = {}


# ── Schemas ───────────────────────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    otp:   str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _send_via_twilio(to_number: str, otp: str) -> None:
    """
    Send OTP SMS via Twilio.
    Raises an exception if the Twilio call fails.
    """
    from twilio.rest import Client
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    client.messages.create(
        body=f"Your GigTrust verification code is: {otp}. Valid for 10 minutes. Do not share it.",
        from_=TWILIO_NUMBER,
        to=to_number,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/send-otp")
def send_otp(req: SendOTPRequest):
    """
    Generate a 6-digit OTP and send it via Twilio SMS to +91<phone>.
    Falls back to console logging if Twilio credentials are not configured.
    """
    digits = "".join(filter(str.isdigit, req.phone))
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Phone must be exactly 10 digits.")

    otp = str(random.randint(100000, 999999))
    _otp_store[digits] = otp

    to_number = f"+91{digits}"

    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        try:
            _send_via_twilio(to_number, otp)
            print(f"[OTP] Twilio SMS sent to {to_number}")
        except Exception as e:
            # Don't expose Twilio errors to the client; log server-side
            print(f"[OTP] Twilio error: {e}")
            raise HTTPException(
                status_code=502,
                detail="Failed to send OTP via SMS. Please try again or contact support.",
            )
    else:
        # Dev fallback — print OTP to uvicorn console
        print(f"[OTP] ⚠️  Twilio not configured. Phone: {digits}  OTP: {otp}")

    masked = digits[-4:].rjust(10, "*")
    return {"msg": f"OTP sent to {masked}"}


@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest):
    """Verify the OTP. Returns { verified: true/false }. OTP is single-use."""
    digits = "".join(filter(str.isdigit, req.phone))
    stored = _otp_store.get(digits)

    if not stored:
        return {"verified": False, "reason": "No OTP found for this number. Please request a new one."}

    if stored != req.otp.strip():
        return {"verified": False, "reason": "Incorrect OTP. Please try again."}

    # One-time use — delete after successful verification
    del _otp_store[digits]
    return {"verified": True}
