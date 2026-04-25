"""
routes/requests.py
Job-request lifecycle endpoints:
  POST /requests/send           — hirer sends a job offer to a worker
  GET  /requests/worker/{id}    — worker fetches their pending/active requests
  GET  /requests/hirer/{id}     — hirer fetches their sent requests
  POST /requests/update         — accept / reject / complete a request

All worker stat mutations are kept atomic via separate MongoDB update ops.
"""

from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from app.db.mongo import job_requests, workers

router = APIRouter(prefix="/requests", tags=["Job Requests"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    """Convert ObjectId fields to strings for JSON serialisation."""
    if not doc:
        return {}
    doc["_id"] = str(doc["_id"])
    return doc


def _to_object_id(raw: str) -> ObjectId:
    try:
        return ObjectId(raw)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID: {raw!r}")


# ── Schemas ───────────────────────────────────────────────────────────────────

class SendRequestSchema(BaseModel):
    hirer_id:  str
    worker_id: str
    job_title: str
    location:  Optional[str] = ""
    duration:  Optional[str] = ""
    reward:    Optional[str] = ""
    skills:    Optional[List[str]] = []
    message:   Optional[str] = ""


class UpdateRequestSchema(BaseModel):
    request_id: str
    status:     str   # "accepted" | "rejected" | "completed"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/send", status_code=201)
def send_request(data: SendRequestSchema):
    """
    Hirer sends a job request to a worker.
    Side-effect: increments worker.total_requests.
    """
    doc = data.model_dump()
    doc["status"]     = "pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    result = job_requests.insert_one(doc)

    # Increment total_requests for the target worker
    try:
        workers.update_one(
            {"_id": _to_object_id(data.worker_id)},
            {"$inc": {"total_requests": 1}},
        )
    except Exception as e:
        # Non-fatal — log and continue
        print(f"[requests] Could not increment total_requests: {e}")

    # ── WhatsApp: auto-notify worker about new job (background thread) ──
    import threading
    def _notify():
        try:
            from app.services.notification_service import send_job_alert
            print(f"[requests] 🔔 Sending WhatsApp job alert to worker_id={data.worker_id}")
            result_wa = send_job_alert(data.worker_id, doc)
            print(f"[requests] 🔔 WhatsApp alert result: {result_wa}")
        except Exception as e:
            import traceback
            print(f"[requests] ❌ WhatsApp alert EXCEPTION: {e}")
            traceback.print_exc()
    threading.Thread(target=_notify, daemon=True).start()

    return {"msg": "Job request sent", "request_id": str(result.inserted_id)}


@router.get("/worker/{worker_id}")
def get_worker_requests(worker_id: str):
    """
    Return all job requests directed at this worker.
    Accepts EITHER the MongoDB _id (worker_id) OR the user_id (auth id).
    Hirers store the MongoDB _id; workers query with their auth user_id —
    this resolves both so the lookup always works.
    """
    from app.db.mongo import workers as workers_col

    # Try to resolve: if worker_id is not a valid ObjectId, it might be a user_id.
    # Check job_requests directly first (covers the case hirer used MongoDB _id).
    # Also resolve via workers collection in case it's a user_id string.
    resolved_ids = {worker_id}  # start with the raw value

    # Try to find the worker doc by user_id to get their _id
    worker_doc = workers_col.find_one({"user_id": worker_id})
    if worker_doc:
        resolved_ids.add(str(worker_doc["_id"]))

    # Also try by MongoDB _id and grab the user_id
    try:
        w_by_id = workers_col.find_one({"_id": ObjectId(worker_id)})
        if w_by_id:
            resolved_ids.add(str(w_by_id.get("user_id", "")))
    except Exception:
        pass

    docs = list(job_requests.find({"worker_id": {"$in": list(resolved_ids)}}))
    return [_serialize(doc) for doc in docs]


@router.get("/hirer/{hirer_id}")
def get_hirer_requests(hirer_id: str):
    """Return all job requests sent by this hirer."""
    docs = list(job_requests.find({"hirer_id": hirer_id}))
    return [_serialize(doc) for doc in docs]


@router.post("/update")
def update_request(data: UpdateRequestSchema):
    """
    Update the status of a job request and mutate worker stats accordingly.

    Status transitions and side-effects:
      pending  → accepted   : worker.available = False, worker.accepted += 1
      accepted → completed  : worker.available = True,  worker.jobs_completed += 1
      pending  → rejected   : no worker-stat change
    """
    VALID_STATUSES = {"accepted", "rejected", "completed"}
    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"status must be one of {VALID_STATUSES}"
        )

    obj_id = _to_object_id(data.request_id)
    req = job_requests.find_one({"_id": obj_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Update request document
    job_requests.update_one(
        {"_id": obj_id},
        {"$set": {
            "status":     data.status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )

    # Update worker stats
    worker_id = req.get("worker_id")
    prev_status = req.get("status", "pending")
    if worker_id:
        try:
            w_id = _to_object_id(worker_id)
            if data.status == "accepted":
                # Worker is now occupied
                workers.update_one(
                    {"_id": w_id},
                    {"$set": {"available": False}, "$inc": {"accepted": 1}},
                )
            elif data.status == "completed":
                # Worker finished the job — free again
                workers.update_one(
                    {"_id": w_id},
                    {"$set": {"available": True}, "$inc": {"jobs_completed": 1}},
                )
            elif data.status == "rejected":
                # Worker rejected — always free again regardless of previous state
                workers.update_one(
                    {"_id": w_id},
                    {"$set": {"available": True}},
                )
        except Exception as e:
            print(f"[requests] Could not update worker stats: {e}")

    return {"msg": f"Request updated to '{data.status}'"}