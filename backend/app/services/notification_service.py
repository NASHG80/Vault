"""
services/notification_service.py
Outbound-only WhatsApp notifications (no webhook needed):
  1. send_login_greeting(worker)         — triggered on worker login
  2. send_job_alert(worker_id, job_doc)   — triggered on new job request
  3. hourly_transaction_reminder()       — runs every 1 hour via scheduler
"""

from app.db.mongo import workers, users, job_requests, transactions, hirers
from app.services.whatsapp_service import send_whatsapp
from bson import ObjectId


# ─── Helper: get phone in E.164 format ─────────────────────────────────

def _get_phone(worker_doc: dict) -> str | None:
    """
    Extract worker phone and return in +91XXXXXXXXXX format.
    Returns None if no phone found.
    """
    phone = worker_doc.get("phone", "")
    if not phone:
        return None
    # Strip spaces/dashes
    phone = phone.strip().replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        phone = f"+91{phone}"
    return phone


# ─── 1. Login Greeting → "Please enter your latest transaction" ────────

def send_login_greeting(worker_doc: dict) -> bool:
    """
    Called when a worker logs in.
    Sends a WhatsApp message asking them to sync their latest transactions.
    """
    phone = _get_phone(worker_doc)
    if not phone:
        return False

    name = worker_doc.get("full_name") or worker_doc.get("name", "Worker")

    msg = (
        f"👋 Welcome back, *{name}*!\n\n"
        f"Hope you had a great day gigging! 💪\n\n"
        f"📋 *Quick Reminder:* Please enter your latest gig transactions "
        f"on GigTrust to keep your profile up-to-date.\n\n"
        f"✅ Updated records help you:\n"
        f"• Boost your Trust Score 📈\n"
        f"• Unlock better loan offers 💰\n"
        f"• Stand out to hirers 🌟\n\n"
        f"Open the app and sync now! 🚀"
    )
    return send_whatsapp(phone, msg)


# ─── 2. Job Request Alert → "You got a request from [hirer] for [job]" ─

def send_job_alert(worker_id: str, job_doc: dict) -> bool:
    """
    Called when a new job request is created targeting a worker.
    Fetches the hirer name from DB and the job details, then sends
    a WhatsApp alert to the worker.

    `worker_id` can be MongoDB _id (str) or user_id (str).
    `job_doc` is the job_request document.
    """
    # ── Resolve worker ──
    worker_doc = None
    try:
        worker_doc = workers.find_one({"_id": ObjectId(worker_id)})
    except Exception:
        pass
    if not worker_doc:
        worker_doc = workers.find_one({"user_id": worker_id})
    if not worker_doc:
        print(f"[JobAlert] Worker not found: {worker_id}")
        return False

    phone = _get_phone(worker_doc)
    if not phone:
        print(f"[JobAlert] No phone for worker: {worker_id}")
        return False

    worker_name = worker_doc.get("full_name") or worker_doc.get("name", "Worker")

    # ── Resolve hirer name ──
    hirer_id = job_doc.get("hirer_id", "")
    hirer_name = "A Hirer"

    if hirer_id:
        # Try hirers collection first
        hirer_doc = hirers.find_one({"user_id": hirer_id})
        if hirer_doc:
            hirer_name = hirer_doc.get("company_name") or hirer_doc.get("full_name", hirer_name)
        else:
            # Fallback: try users collection
            try:
                user_doc = users.find_one({"_id": ObjectId(hirer_id)})
                if user_doc:
                    hirer_name = user_doc.get("name", hirer_name)
            except Exception:
                pass

    # ── Build message ──
    job_title = job_doc.get("job_title", "New Job")
    location  = job_doc.get("location", "")
    reward    = job_doc.get("reward", "")
    duration  = job_doc.get("duration", "")
    skills    = job_doc.get("skills", [])
    message_text = job_doc.get("message", "")

    msg = (
        f"🔔 *New Job Request!*\n\n"
        f"Hey *{worker_name}*, you have a new job offer!\n\n"
        f"👤 *From:* {hirer_name}\n"
        f"💼 *Job:* {job_title}\n"
    )
    if location:
        msg += f"📍 *Location:* {location}\n"
    if reward:
        msg += f"💰 *Pay:* {reward}\n"
    if duration:
        msg += f"⏱️ *Duration:* {duration}\n"
    if skills:
        msg += f"🛠️ *Skills:* {', '.join(skills)}\n"
    if message_text:
        msg += f"\n💬 *Message:* {message_text}\n"

    msg += (
        f"\n📱 Open GigTrust to *Accept* or *Decline* this request.\n"
        f"Good luck! 🍀"
    )
    return send_whatsapp(phone, msg)


# ─── 3. Hourly Reminder → sent to all registered workers ──────────────

def hourly_transaction_reminder() -> int:
    """
    Runs every 1 hour via APScheduler.
    Finds all workers with a registered phone number and sends them
    a reminder to update their transactions on GigTrust.
    Returns the count of workers reminded.
    """
    all_workers = list(workers.find(
        {"phone": {"$exists": True, "$ne": ""}},
        {"user_id": 1, "full_name": 1, "name": 1, "phone": 1}
    ))

    if not all_workers:
        print("[Scheduler] No workers with phone numbers found.")
        return 0

    reminded = 0
    for w in all_workers:
        phone = _get_phone(w)
        if not phone:
            continue

        name = w.get("full_name") or w.get("name", "Worker")

        msg = (
            f"⏰ *Hourly Reminder — GigTrust*\n\n"
            f"Hi *{name}*! 👋\n\n"
            f"Don't forget to add your latest gig transactions.\n\n"
            f"📋 Keeping your work history updated ensures:\n"
            f"• 📊 Accurate Trust Score\n"
            f"• 🏦 Better loan eligibility\n"
            f"• 🔍 Higher visibility for hirers\n\n"
            f"Open GigTrust and sync your transactions now! 🚀"
        )

        if send_whatsapp(phone, msg):
            reminded += 1

    print(f"[Scheduler] ✅ Hourly reminder sent to {reminded}/{len(all_workers)} workers.")
    return reminded
