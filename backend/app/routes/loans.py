"""
routes/loans.py
Loan application endpoints:
  POST /loans/apply       — Worker submits loan request (auto-attaches published cert)
  GET  /loans/pending     — Lender fetches all pending loan requests
  POST /loans/action      — Lender approves/rejects a loan
  GET  /loans/my          — Worker views own loan applications
"""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

from app.db.mongo import loans, certificates, workers
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/loans", tags=["Loans"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class LoanApplySchema(BaseModel):
    amount: float
    duration: str        # e.g. "3 months", "6 months"
    purpose: str


class LoanActionSchema(BaseModel):
    loan_id: str
    action: str          # "approved" or "rejected"
    remark: Optional[str] = ""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    if not doc:
        return {}
    doc["_id"] = str(doc["_id"])
    return doc


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/apply")
async def apply_for_loan(data: LoanApplySchema, user=Depends(get_current_user)):
    """
    Worker submits a loan application.
    Auto-fetches the worker's published certificate and attaches it.
    """
    user_id = user["user_id"]

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Loan amount must be positive.")
    if not data.purpose.strip():
        raise HTTPException(status_code=400, detail="Purpose is required.")

    # Get worker name
    worker = workers.find_one({"user_id": user_id})
    worker_name = worker.get("full_name", "Unknown") if worker else "Unknown"

    # Fetch published certificate (if any)
    cert = certificates.find_one({
        "worker_id": user_id,
        "is_published": True,
    })

    certificate_cid = ""
    public_summary = {}
    if cert:
        certificate_cid = cert.get("certificate_cid", "")
        public_summary = cert.get("public_summary", {})

    loan_doc = {
        "worker_user_id": user_id,
        "worker_name":    worker_name,
        "amount":         data.amount,
        "duration":       data.duration,
        "purpose":        data.purpose.strip(),
        "certificate_cid": certificate_cid,
        "public_summary": public_summary,
        "status":         "pending",
        "lender_remark":  "",
        "created_at":     datetime.now(timezone.utc).isoformat(),
    }

    result = loans.insert_one(loan_doc)
    return {"msg": "Loan application submitted.", "loan_id": str(result.inserted_id)}


@router.get("/pending")
async def get_pending_loans(user=Depends(get_current_user)):
    """Lender fetches all pending loan requests."""
    docs = list(loans.find({"status": "pending"}).sort("created_at", -1))
    return [_serialize(d) for d in docs]


@router.post("/action")
async def action_loan(data: LoanActionSchema, user=Depends(get_current_user)):
    """Lender approves or rejects a loan request."""
    if data.action not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Action must be 'approved' or 'rejected'.")

    try:
        oid = ObjectId(data.loan_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid loan_id.")

    loan = loans.find_one({"_id": oid})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found.")

    loans.update_one(
        {"_id": oid},
        {"$set": {
            "status": data.action,
            "lender_remark": data.remark or "",
            "actioned_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"msg": f"Loan {data.action}."}


@router.get("/my")
async def get_my_loans(user=Depends(get_current_user)):
    """Worker fetches their own loan applications."""
    user_id = user["user_id"]
    docs = list(loans.find({"worker_user_id": user_id}).sort("created_at", -1))
    return [_serialize(d) for d in docs]


@router.get("/history")
async def get_loan_history(user=Depends(get_current_user)):
    """
    Lender/Hirer: fetch all loans that have been actioned (approved or rejected).
    Returns full details including public_summary for display in Payment History page.
    """
    docs = list(
        loans.find({"status": {"$in": ["approved", "rejected"]}})
        .sort("actioned_at", -1)
    )
    return [_serialize(d) for d in docs]

