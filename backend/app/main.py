import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import FRONTEND_URL
from app.db.mongo import setup_indexes
import app.routes.auth as auth
import app.routes.worker as worker
import app.routes.hirer as hirer
import app.routes.requests as requests
import app.routes.matching as matching
import app.routes.transactions as transactions
import app.routes.certificates as certificates
import app.routes.kyc_manual as kyc_manual
import app.routes.upload as upload
import app.routes.admin as admin
import app.routes.loans as loans
import app.routes.analytics as analytics
import app.routes.whatsapp as whatsapp
import app.routes.fraud as fraud


# ── Background Scheduler ─────────────────────────────────────────────
_scheduler = None

def _start_scheduler():
    """Start APScheduler for hourly WhatsApp reminders (if available)."""
    global _scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from app.services.notification_service import hourly_transaction_reminder

        _scheduler = BackgroundScheduler()
        _scheduler.add_job(
            hourly_transaction_reminder,
            "interval",
            hours=1,
            id="whatsapp_hourly_reminder",
            replace_existing=True,
        )
        _scheduler.start()
        print("[Scheduler] ✅ Hourly WhatsApp reminder job started (every 1 hour).")
    except ImportError:
        print("[Scheduler] ⚠️  APScheduler not installed — hourly reminders disabled.")
        print("[Scheduler]    Run: pip install apscheduler")
    except Exception as e:
        print(f"[Scheduler] ❌ Failed to start: {e}")


def _stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        print("[Scheduler] Stopped.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await setup_indexes()
    _start_scheduler()
    yield
    # Shutdown
    _stop_scheduler()


app = FastAPI(title="GigTrust Backend", version="1.0.0", lifespan=lifespan)

# CORS — allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static assets at /static/uploads/
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(worker.router)
app.include_router(hirer.router)
app.include_router(requests.router)
app.include_router(matching.router)
app.include_router(kyc_manual.router)
app.include_router(upload.router)
app.include_router(admin.router)
app.include_router(transactions.router)
app.include_router(certificates.router)
app.include_router(loans.router)
app.include_router(analytics.router)
app.include_router(whatsapp.router)
app.include_router(fraud.router)


@app.on_event("startup")
async def startup_event():
    await setup_indexes()


@app.get("/")
def root():
    return {"msg": "GigTrust Backend is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}