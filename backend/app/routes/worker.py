"""
routes/worker.py
Worker endpoints:
  POST /worker/create                      — legacy bare doc creation
  POST /worker/kyc                         — manual KYC form submission
  GET  /worker/status/{user_id}            — KYC gate status check
  GET  /worker/check-profile/{user_id}     — legacy alias kept for compatibility
  POST /worker/profile                     — save phone/skills/location post-KYC
  GET  /worker/id-card/{worker_id}         — Digital ID card payload
  GET  /worker/public-profile/{user_id}    — PUBLIC: id-card + published cert (for QR scan)
  GET  /worker/{worker_id}                 — fetch by _id
"""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from bson import ObjectId

from app.db.mongo import workers, users, certificates

router = APIRouter(prefix="/worker", tags=["Worker"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    if not doc:
        return {}
    doc["_id"] = str(doc["_id"])
    return doc


def _get_worker_by_id(worker_id: str) -> dict:
    try:
        doc = workers.find_one({"_id": ObjectId(worker_id)})
    except Exception:
        doc = None
    if not doc:
        raise HTTPException(status_code=404, detail="Worker not found")
    return doc


# ── Schemas ───────────────────────────────────────────────────────────────────

class KYCSubmitSchema(BaseModel):
    user_id:        str
    full_name:      str
    phone:          str
    skills:         List[str]
    location:       str
    aadhaar_last4:  str
    aadhaar_image:  str   # URL returned from POST /upload
    selfie_image:   str   # URL returned from POST /upload


class ProfileSetupSchema(BaseModel):
    user_id:  str
    phone:    str
    skills:   List[str]
    location: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/create")
def create_worker(data: dict):
    """Legacy: create a minimal worker doc."""
    workers.insert_one(data)
    return {"msg": "worker created"}


@router.post("/kyc")
def submit_kyc(data: KYCSubmitSchema):
    """
    Manual KYC form submission.
    Creates (or updates) the worker document with status=pending.
    - Requires OTP to have been verified client-side first.
    - Stores masked Aadhaar (XXXX-XXXX-<last4>) — never the full number.
    """
    # Validate phone
    digits = "".join(filter(str.isdigit, data.phone))
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Phone must be exactly 10 digits.")

    # Validate aadhaar last 4
    if not data.aadhaar_last4.isdigit() or len(data.aadhaar_last4) != 4:
        raise HTTPException(status_code=400, detail="aadhaar_last4 must be exactly 4 digits.")

    if not data.skills:
        raise HTTPException(status_code=400, detail="At least one skill is required.")

    if not data.aadhaar_image or not data.selfie_image:
        raise HTTPException(status_code=400, detail="Both Aadhaar image and selfie are required.")

    aadhaar_masked = f"XXXX-XXXX-{data.aadhaar_last4}"

    workers.update_one(
        {"user_id": data.user_id},
        {
            "$set": {
                "user_id":        data.user_id,
                "full_name":      data.full_name,
                "phone":          data.phone,
                "phone_verified": True,
                "skills":         data.skills,
                "location":       data.location,
                "aadhaar_masked": aadhaar_masked,
                "aadhaar_image":  data.aadhaar_image,
                "selfie_image":   data.selfie_image,
                "kyc_status":     "pending",
                "kyc_verified":   False,
                "available":      False,
                "rating":         0.0,
                "jobs_completed": 0,
                "trust_score":    50,
                "accepted":       0,
                "total_requests": 0,
                "admin_remark":   "",
                "submitted_at":   datetime.now(timezone.utc).isoformat(),
            }
        },
        upsert=True,
    )
    return {"msg": "KYC submitted successfully. Awaiting admin review."}


@router.get("/status/{user_id}")
def worker_status(user_id: str):
    """
    KYC status gate used by the frontend after login.
    Returns: { status: 'new' | 'pending' | 'approved' | 'rejected', admin_remark? }
    """
    worker = workers.find_one({"user_id": user_id})
    if not worker:
        return {"status": "new"}

    kyc_status = worker.get("kyc_status", "new")

    response = {"status": kyc_status}
    if kyc_status == "rejected":
        response["admin_remark"] = worker.get("admin_remark", "")
    return response


@router.get("/check-profile/{user_id}")
def check_profile(user_id: str):
    """Legacy compatibility alias — maps to the same status logic."""
    worker = workers.find_one({"user_id": user_id})
    if not worker:
        return {"status": "new"}
    kyc = worker.get("kyc_status", "new")
    if kyc == "approved":
        return {"status": "ready"}
    if kyc == "pending":
        return {"status": "kyc_pending"}
    if kyc == "rejected":
        return {"status": "rejected"}
    return {"status": "new"}


@router.post("/profile")
def setup_profile(data: ProfileSetupSchema):
    """Save phone/skills/location after KYC approval."""
    digits = "".join(filter(str.isdigit, data.phone))
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Phone must be exactly 10 digits.")
    if not data.skills:
        raise HTTPException(status_code=400, detail="At least one skill is required.")
    if not data.location.strip():
        raise HTTPException(status_code=400, detail="Location is required.")

    worker = workers.find_one({"user_id": data.user_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found.")
    if not worker.get("kyc_verified"):
        raise HTTPException(status_code=403, detail="KYC not approved. Cannot save profile.")

    workers.update_one(
        {"user_id": data.user_id},
        {"$set": {"phone": data.phone, "skills": data.skills, "location": data.location.strip()}},
    )
    return {"msg": "Profile saved."}


@router.get("/id-card/{worker_id}")
def get_id_card(worker_id: str):
    """
    Digital ID Card — supports lookup by MongoDB _id OR user_id string.
    Frontend stores user_id from JWT; this makes both work.
    """
    # Try ObjectId first
    worker = None
    try:
        worker = workers.find_one({"_id": ObjectId(worker_id)})
    except Exception:
        pass
    # Fall back to user_id
    if not worker:
        worker = workers.find_one({"user_id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    full_name = worker.get("full_name", "") or "—"

    return {
        "worker_id":      str(worker["_id"]),
        "name":           full_name,
        "skills":         worker.get("skills",          []),
        "trust_score":    worker.get("trust_score",     50),
        "rating":         worker.get("rating",          0.0),
        "jobs_completed": worker.get("jobs_completed",  0),
        "location":       worker.get("location",        ""),
        "profile_photo":  worker.get("selfie_image",    ""),
        "aadhaar_masked": worker.get("aadhaar_masked",  ""),
        "kyc_verified":   worker.get("kyc_verified",    False),
        "kyc_status":     worker.get("kyc_status",      "pending"),
        "available":      worker.get("available",       False),
        "phone":          worker.get("phone",           ""),
    }


@router.get("/public-profile/{user_id}")
def get_public_profile(user_id: str):
    """
    PUBLIC endpoint — no auth required.
    Returns the worker's ID-card data plus their latest published certificate.
    Used by the QR-code profile page so anyone can scan and verify.
    Lookup by user_id (the string stored in JWT / localStorage).
    """
    worker = workers.find_one({"user_id": user_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # ── ID card payload ───────────────────────────────────────────────
    id_card = {
        "worker_id":      str(worker["_id"]),
        "user_id":        user_id,
        "name":           worker.get("full_name", "") or "—",
        "skills":         worker.get("skills",          []),
        "trust_score":    worker.get("trust_score",     50),
        "rating":         worker.get("rating",          0.0),
        "jobs_completed": worker.get("jobs_completed",  0),
        "location":       worker.get("location",        ""),
        "profile_photo":  worker.get("selfie_image",    ""),
        "aadhaar_masked": worker.get("aadhaar_masked",  ""),
        "kyc_verified":   worker.get("kyc_verified",    False),
        "kyc_status":     worker.get("kyc_status",      "pending"),
        "available":      worker.get("available",       False),
        "phone":          worker.get("phone",           ""),
    }

    # ── Published certificate (if any) ────────────────────────────────
    cert_doc = certificates.find_one({"worker_id": user_id, "is_published": True})
    cert = None
    if cert_doc:
        cert = {
            "id":             str(cert_doc["_id"]),
            "worker_id":      cert_doc["worker_id"],
            "proof_hash":     cert_doc.get("proof_hash", ""),
            "public_summary": cert_doc.get("public_summary", {}),
            "platform_tags":  cert_doc.get("platform_tags", []),
            "period":         cert_doc.get("period", ""),
            "certificate_cid": cert_doc.get("certificate_cid"),
            "published_at":   cert_doc.get("published_at", ""),
        }

    return {
        "id_card": id_card,
        "certificate": cert,
    }


@router.get("/{worker_id}")
def get_worker(worker_id: str):
    """Fetch a single worker doc by _id."""
    return _serialize(_get_worker_by_id(worker_id))