"""
routes/admin.py
Admin-only endpoints:
  GET  /admin/kyc/pending       — list workers awaiting KYC review
  GET  /admin/kyc/all           — all workers
  POST /admin/kyc/approve       — approve a worker
  POST /admin/kyc/reject        — reject with a remark
  GET  /admin/users/all         — all users (workers + hirers + lenders)
  POST /admin/users/flag        — flag / unflag any user account
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional

from app.db.mongo import workers, users
from app.utils.jwt_handler import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ApproveRequest(BaseModel):
    worker_id: str


class RejectRequest(BaseModel):
    worker_id: str
    remark:    str = ""


class FlagRequest(BaseModel):
    user_id:  str
    role:     str          # "worker" | "hirer" | "lender"
    flagged:  bool
    reason:   Optional[str] = ""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _s(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


def _find_worker(worker_id: str) -> dict:
    doc = None
    try:
        doc = workers.find_one({"_id": ObjectId(worker_id)})
    except Exception:
        pass
    if not doc:
        doc = workers.find_one({"user_id": worker_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Worker not found.")
    return doc


# ── KYC Endpoints ─────────────────────────────────────────────────────────────

@router.get("/kyc/pending")
def get_pending_kyc(admin=Depends(require_admin)):
    """Return all workers whose KYC status is pending."""
    docs = list(workers.find({"kyc_status": "pending"}))
    return [_s(d) for d in docs]


@router.get("/kyc/all")
def get_all_kyc(admin=Depends(require_admin)):
    """Return all workers with any KYC status (for admin overview)."""
    docs = list(workers.find({}))
    return [_s(d) for d in docs]


@router.post("/kyc/approve")
def approve_kyc(req: ApproveRequest, admin=Depends(require_admin)):
    """Approve a worker — unlock dashboard access."""
    doc = _find_worker(req.worker_id)
    workers.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "kyc_status":   "approved",
                "kyc_verified": True,
                "available":    True,
                "trust_score":  70,
                "admin_remark": "",
            }
        },
    )
    return {"msg": f"Worker {req.worker_id} approved."}


@router.post("/kyc/reject")
def reject_kyc(req: RejectRequest, admin=Depends(require_admin)):
    """Reject a worker with an optional remark."""
    doc = _find_worker(req.worker_id)
    workers.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "kyc_status":   "rejected",
                "kyc_verified": False,
                "admin_remark": req.remark,
            }
        },
    )
    return {"msg": f"Worker {req.worker_id} rejected.", "remark": req.remark}


# ── User Management Endpoints ─────────────────────────────────────────────────

@router.get("/users/all")
def get_all_users(admin=Depends(require_admin)):
    """
    Return all registered users (workers / hirers / lenders) with their
    role, KYC status, flagged status and basic identity info.
    Workers are in the workers collection; hirers and lenders are in users.
    """
    result = []

    # ── Workers (from workers collection) ─────────────────────────────────
    for w in workers.find({}):
        result.append({
            "_id":        str(w["_id"]),
            "user_id":    w.get("user_id", ""),
            "name":       w.get("full_name") or w.get("name", "—"),
            "email":      w.get("email", ""),
            "phone":      w.get("phone", ""),
            "location":   w.get("location", ""),
            "role":       "worker",
            "kyc_status": w.get("kyc_status", "new"),
            "flagged":    w.get("flagged", False),
            "flag_reason": w.get("flag_reason", ""),
            "trust_score": w.get("trust_score", 0),
            "skills":     w.get("skills", []),
            "jobs_completed": w.get("jobs_completed", 0),
            "created_at": str(w.get("created_at", "")),
        })

    # ── Hirers & Lenders (from users collection) ───────────────────────────
    for u in users.find({"role": {"$in": ["hirer", "lender"]}}):
        result.append({
            "_id":        str(u["_id"]),
            "user_id":    str(u["_id"]),
            "name":       u.get("name", "—"),
            "email":      u.get("email", ""),
            "phone":      u.get("phone", ""),
            "location":   "",
            "role":       u.get("role", "hirer"),
            "kyc_status": "n/a",
            "flagged":    u.get("flagged", False),
            "flag_reason": u.get("flag_reason", ""),
            "trust_score": None,
            "skills":     [],
            "jobs_completed": 0,
            "created_at": str(u.get("created_at", "")),
        })

    return result


@router.post("/users/flag")
def flag_user(req: FlagRequest, admin=Depends(require_admin)):
    """Flag or unflag a user account. Works across all role types."""
    update = {
        "$set": {
            "flagged":     req.flagged,
            "flag_reason": req.reason or "",
        }
    }

    if req.role == "worker":
        # Try _id first, then user_id
        matched = None
        try:
            matched = workers.update_one({"_id": ObjectId(req.user_id)}, update)
        except Exception:
            pass
        if not matched or matched.matched_count == 0:
            matched = workers.update_one({"user_id": req.user_id}, update)
        if not matched or matched.matched_count == 0:
            raise HTTPException(status_code=404, detail="Worker not found.")
    else:
        # hirer / lender — in users collection
        matched = None
        try:
            matched = users.update_one({"_id": ObjectId(req.user_id)}, update)
        except Exception:
            pass
        if not matched or matched.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found.")

    action = "flagged" if req.flagged else "unflagged"
    return {"msg": f"User {req.user_id} {action}.", "flagged": req.flagged}
