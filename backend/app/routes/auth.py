import secrets
import bcrypt
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime
from app.db.mongo import async_users, otp_verifications
from app.schemas.auth_schema import (
    RegisterSchema, LoginSchema,
    TokenResponse, UserResponse, OTPVerifySchema
)
from app.utils.jwt_handler import create_token, get_current_user
from app.utils.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Hashing helpers (pure bcrypt 5.x compatible) ──────────────────────

def hash_secret(value: str) -> str:
    """Hash a password or OTP using bcrypt."""
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()


def verify_secret(plain: str, hashed: str) -> bool:
    """Timing-safe bcrypt verification."""
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def generate_otp() -> str:
    """Cryptographically secure 6-digit OTP."""
    return str(secrets.randbelow(1_000_000)).zfill(6)


# ── POST /register ────────────────────────────────────────────────────
@router.post("/register")
async def register(data: RegisterSchema, background_tasks: BackgroundTasks):
    """Stage 1: Validate → hash → store OTP → send email."""

    # Reject if user already exists
    if await async_users.find_one({"email": data.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    # Validate role
    if data.role not in ("worker", "hirer", "lender", "admin"):
        raise HTTPException(status_code=400, detail="Role must be worker, hirer, or lender")

    # Rate limiting: max 3 OTP requests per 5 minutes
    existing = await otp_verifications.find_one({"email": data.email})
    now = datetime.utcnow()

    if existing:
        first_at = existing.get("first_request_at", now)
        elapsed = (now - first_at).total_seconds()
        count = existing.get("requests_count", 1)
        if elapsed < 300 and count >= 3:
            raise HTTPException(
                status_code=429,
                detail="Too many OTP requests. Please wait 5 minutes."
            )
        first_at = first_at if elapsed < 300 else now
        new_count = (count + 1) if elapsed < 300 else 1
    else:
        first_at = now
        new_count = 1

    # Generate & hash OTP
    otp = generate_otp()

    otp_doc = {
        "email": data.email,
        "otp": hash_secret(otp),
        "createdAt": now,
        "first_request_at": first_at,
        "requests_count": new_count,
        "userData": {
            "name": data.name,
            "password": hash_secret(data.password),
            "role": data.role,
        },
    }

    # Upsert (replace existing or create new)
    await otp_verifications.replace_one(
        {"email": data.email},
        otp_doc,
        upsert=True,
    )

    # Send email in background (non-blocking)
    background_tasks.add_task(send_otp_email, data.email, otp)

    return {"message": "OTP sent successfully"}


# ── POST /verify-otp ──────────────────────────────────────────────────
@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(data: OTPVerifySchema):
    """Stage 2: Verify OTP → create user → return JWT."""

    record = await otp_verifications.find_one({"email": data.email})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    if not verify_secret(data.otp, record["otp"]):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if await async_users.find_one({"email": data.email}):
        raise HTTPException(status_code=409, detail="User already registered")

    user_data = record["userData"]

    result = await async_users.insert_one({
        "name": user_data["name"],
        "email": data.email,
        "password": user_data["password"],
        "role": user_data["role"],
    })
    user_id = str(result.inserted_id)

    await otp_verifications.delete_one({"email": data.email})

    token = create_token({"user_id": user_id, "email": data.email, "role": user_data["role"]})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user_data["name"],
            email=data.email,
            role=user_data["role"],
        ),
    )


# ── POST /resend-otp ──────────────────────────────────────────────────
@router.post("/resend-otp")
async def resend_otp(data: OTPVerifySchema, background_tasks: BackgroundTasks):
    """Re-send a fresh OTP (respects rate limit)."""
    record = await otp_verifications.find_one({"email": data.email})
    if not record:
        raise HTTPException(status_code=400, detail="No pending registration for this email")

    now = datetime.utcnow()
    first_at = record.get("first_request_at", now)
    elapsed = (now - first_at).total_seconds()
    count = record.get("requests_count", 1)

    if elapsed < 300 and count >= 3:
        raise HTTPException(
            status_code=429,
            detail="Too many OTP requests. Please wait 5 minutes."
        )

    new_otp = generate_otp()
    new_first_at = first_at if elapsed < 300 else now
    new_count = (count + 1) if elapsed < 300 else 1

    await otp_verifications.update_one(
        {"email": data.email},
        {"$set": {
            "otp": hash_secret(new_otp),
            "createdAt": now,
            "first_request_at": new_first_at,
            "requests_count": new_count,
        }}
    )

    background_tasks.add_task(send_otp_email, data.email, new_otp)
    return {"message": "OTP resent successfully"}


# ── POST /login ───────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(data: LoginSchema, background_tasks: BackgroundTasks):
    """Authenticate user and return JWT."""
    user = await async_users.find_one({"email": data.email})
    if not user or not verify_secret(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_token({"user_id": user_id, "email": user["email"], "role": user["role"]})

    # ── WhatsApp: send login greeting to workers ──────────────────
    if user.get("role") == "worker":
        background_tasks.add_task(_send_worker_login_whatsapp, user_id)

    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, name=user["name"], email=user["email"], role=user["role"]),
    )


def _send_worker_login_whatsapp(user_id: str):
    """Background task: send WhatsApp greeting when worker logs in."""
    try:
        from app.db.mongo import workers
        from app.services.notification_service import send_login_greeting

        worker_doc = workers.find_one({"user_id": user_id})
        if worker_doc and worker_doc.get("phone"):
            send_login_greeting(worker_doc)
    except Exception as e:
        print(f"[Auth] WhatsApp login greeting failed (non-fatal): {e}")


# ── GET /me ───────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the authenticated user's profile."""
    user = await async_users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
    )