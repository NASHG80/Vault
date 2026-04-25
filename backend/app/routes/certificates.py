from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.db.mongo import certificates
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/certificates", tags=["Certificates"])


# ── Schemas ────────────────────────────────────────────────────────────

class EncryptedPayload(BaseModel):
    ciphertext: str
    iv: str


class CertificateSaveRequest(BaseModel):
    wallet_address: str
    proof_hash: str
    encrypted_data: EncryptedPayload
    platform_tags: List[str]
    period: str
    certificate_cid: Optional[str] = None


class PublishCertificateRequest(BaseModel):
    """
    Publish a certificate with plaintext public summary.
    The worker explicitly chooses which fields to make visible.
    """
    proof_hash: str
    public_summary: Dict[str, Any]  # plaintext data worker chose to showcase
    platform_tags: List[str]
    period: str
    certificate_cid: Optional[str] = None


class CertificateResponse(BaseModel):
    id: str
    worker_id: str
    wallet_address: str
    proof_hash: str
    platform_tags: List[str]
    period: str
    certificate_cid: Optional[str]
    created_at: str


class PublishedCertificateResponse(BaseModel):
    id: str
    worker_id: str
    proof_hash: str
    public_summary: Dict[str, Any]
    platform_tags: List[str]
    period: str
    certificate_cid: Optional[str]
    published_at: str


# ── Routes ─────────────────────────────────────────────────────────────

@router.post("/save", response_model=CertificateResponse)
def save_certificate(
    data: CertificateSaveRequest,
    current_user: dict = Depends(get_current_user),
):
    """Store encrypted certificate reference (private)."""
    doc = {
        "worker_id": current_user["user_id"],
        "wallet_address": data.wallet_address,
        "proof_hash": data.proof_hash,
        "encrypted_data": data.encrypted_data.model_dump(),
        "platform_tags": data.platform_tags,
        "period": data.period,
        "certificate_cid": data.certificate_cid,
        "is_published": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = certificates.insert_one(doc)

    return CertificateResponse(
        id=str(result.inserted_id),
        worker_id=doc["worker_id"],
        wallet_address=doc["wallet_address"],
        proof_hash=doc["proof_hash"],
        platform_tags=doc["platform_tags"],
        period=doc["period"],
        certificate_cid=doc["certificate_cid"],
        created_at=doc["created_at"],
    )


@router.post("/publish", response_model=PublishedCertificateResponse)
def publish_certificate(
    data: PublishCertificateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Publish a certificate with plaintext public summary.
    Worker explicitly chooses which data to show on their dashboard.
    One worker = one active published certificate (upsert pattern).
    """
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "worker_id": current_user["user_id"],
        "proof_hash": data.proof_hash,
        "public_summary": data.public_summary,
        "platform_tags": data.platform_tags,
        "period": data.period,
        "certificate_cid": data.certificate_cid,
        "is_published": True,
        "published_at": now,
    }

    # Upsert: replace existing published cert for this worker
    result = certificates.find_one_and_update(
        {"worker_id": current_user["user_id"], "is_published": True},
        {"$set": doc},
        upsert=True,
        return_document=True,
    )

    # If result is None (upserted fresh), find the new doc
    if result is None:
        result = certificates.find_one({"worker_id": current_user["user_id"], "is_published": True})

    return PublishedCertificateResponse(
        id=str(result.get("_id", "")),
        worker_id=result["worker_id"],
        proof_hash=result["proof_hash"],
        public_summary=result["public_summary"],
        platform_tags=result.get("platform_tags", []),
        period=result.get("period", ""),
        certificate_cid=result.get("certificate_cid"),
        published_at=result.get("published_at", now),
    )


@router.get("/published/me", response_model=Optional[PublishedCertificateResponse])
def get_my_published_certificate(current_user: dict = Depends(get_current_user)):
    """Get the current user's published (public) certificate."""
    doc = certificates.find_one({"worker_id": current_user["user_id"], "is_published": True})
    if not doc:
        return None
    return PublishedCertificateResponse(
        id=str(doc["_id"]),
        worker_id=doc["worker_id"],
        proof_hash=doc["proof_hash"],
        public_summary=doc["public_summary"],
        platform_tags=doc.get("platform_tags", []),
        period=doc.get("period", ""),
        certificate_cid=doc.get("certificate_cid"),
        published_at=doc.get("published_at", ""),
    )


@router.get("/my", response_model=List[CertificateResponse])
def get_my_certificates(current_user: dict = Depends(get_current_user)):
    """Return all certificate references for the current user."""
    docs = list(
        certificates.find({"worker_id": current_user["user_id"]}).sort("created_at", -1)
    )
    return [
        CertificateResponse(
            id=str(d["_id"]),
            worker_id=d["worker_id"],
            wallet_address=d.get("wallet_address", ""),
            proof_hash=d["proof_hash"],
            platform_tags=d.get("platform_tags", []),
            period=d.get("period", ""),
            certificate_cid=d.get("certificate_cid"),
            created_at=d.get("created_at", ""),
        )
        for d in docs
    ]


@router.get("/verify/{proof_hash}")
def verify_certificate(proof_hash: str):
    """Public endpoint: verify a certificate proof hash exists."""
    doc = certificates.find_one({"proof_hash": proof_hash})
    if not doc:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {
        "verified": True,
        "proof_hash": proof_hash,
        "platform_tags": doc.get("platform_tags", []),
        "period": doc.get("period", ""),
        "certificate_cid": doc.get("certificate_cid"),
        "issued_at": doc.get("created_at", doc.get("published_at", "")),
    }
