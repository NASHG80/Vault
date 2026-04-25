"""
routes/analytics.py
Analytics & AI Insights endpoints:
  GET  /analytics/worker-data    — Full worker snapshot from MongoDB (stats + cert)
  POST /analytics/ai-insights    — Groq-powered: policies, loan eligibility, improvement tips
"""

import os
import json
import re
from fastapi import APIRouter, HTTPException, Depends
from groq import Groq, RateLimitError

from app.db.mongo import workers, certificates, loans
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# ── Groq client singleton ─────────────────────────────────────────────────────
_groq_client = None

def get_groq():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


# ── GET /analytics/worker-data ────────────────────────────────────────────────

@router.get("/worker-data")
def get_worker_analytics_data(user=Depends(get_current_user)):
    """Full real-time MongoDB snapshot for the authenticated worker."""
    user_id = user["user_id"]

    worker = workers.find_one({"user_id": user_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    cert = certificates.find_one({"worker_id": user_id, "is_published": True})
    cert_summary = cert.get("public_summary", {}) if cert else {}
    platform_tags = cert.get("platform_tags", []) if cert else []

    my_loans = list(loans.find({"worker_user_id": user_id}))
    loan_stats = {
        "total":    len(my_loans),
        "approved": sum(1 for l in my_loans if l.get("status") == "approved"),
        "rejected": sum(1 for l in my_loans if l.get("status") == "rejected"),
        "pending":  sum(1 for l in my_loans if l.get("status") == "pending"),
    }

    total_req = worker.get("total_requests", 0)
    accepted  = worker.get("accepted", 0)
    acceptance_rate = round((accepted / total_req * 100), 1) if total_req > 0 else 0

    return {
        "name":             worker.get("full_name", ""),
        "location":         worker.get("location", ""),
        "skills":           worker.get("skills", []),
        "phone_verified":   worker.get("phone_verified", False),
        "kyc_status":       worker.get("kyc_status", "pending"),
        "kyc_verified":     worker.get("kyc_verified", False),
        "submitted_at":     worker.get("submitted_at", ""),
        "available":        worker.get("available", False),
        "trust_score":      worker.get("trust_score", 50),
        "rating":           round(worker.get("rating", 0.0), 1),
        "jobs_completed":   worker.get("jobs_completed", 0),
        "total_requests":   total_req,
        "accepted":         accepted,
        "acceptance_rate":  acceptance_rate,
        "has_certificate":  cert is not None,
        "total_earnings":   cert_summary.get("totalEarnings", 0),
        "total_gigs":       cert_summary.get("totalGigs", 0),
        "platform_tags":    platform_tags,
        "cert_trust_score": cert_summary.get("trustScore", 0),
        "loan_stats":       loan_stats,
        "latest_loan_amount": my_loans[0].get("amount", 0) if my_loans else 0,
    }


# ── POST /analytics/ai-insights ───────────────────────────────────────────────

@router.post("/ai-insights")
def get_ai_insights(user=Depends(get_current_user)):
    """Calls Groq llama-3.1-8b-instant with the worker's MongoDB snapshot."""
    user_id = user["user_id"]

    worker = workers.find_one({"user_id": user_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    cert = certificates.find_one({"worker_id": user_id, "is_published": True})
    cert_summary = cert.get("public_summary", {}) if cert else {}
    platform_tags = cert.get("platform_tags", []) if cert else []

    my_loans  = list(loans.find({"worker_user_id": user_id}))
    loan_count     = len(my_loans)
    approved_loans = sum(1 for l in my_loans if l.get("status") == "approved")
    total_req  = worker.get("total_requests", 0)
    accepted   = worker.get("accepted", 0)

    skills    = ", ".join(worker.get("skills", [])) or "Unspecified"
    location  = worker.get("location", "India")
    trust     = worker.get("trust_score", 50)
    rating    = round(worker.get("rating", 0.0), 1)
    jobs_done = worker.get("jobs_completed", 0)
    earnings  = cert_summary.get("totalEarnings", 0)
    gigs      = cert_summary.get("totalGigs", 0)
    kyc_ok    = worker.get("kyc_verified", False)
    tags      = ", ".join(platform_tags) or "None"

    # ── Compact prompt (~500 tokens) ──────────────────────────────────────────
    prompt = (
        "You are a financial analyst for Indian gig workers. "
        "Analyze the worker below and return ONLY valid JSON — no markdown, no extra text.\n\n"
        f"Skills:{skills}|Location:{location}|Trust:{trust}/99|Rating:{rating}/5"
        f"|Jobs:{jobs_done}|Requests:{total_req}|Accepted:{accepted}"
        f"|KYC:{kyc_ok}|Cert:{cert is not None}|EAS_gigs:{gigs}"
        f"|Earnings:Rs{earnings}|Tags:{tags}|Loans:{loan_count}(ok:{approved_loans})\n\n"
        'JSON schema to fill:\n'
        '{"credit_score":INT_0_100,'
        '"loan_eligibility":{"eligible":BOOL,"max_amount":INT_RUPEES,"reason":"2 sentences"},'
        '"improvement_tips":[{"priority":"high|medium|low","title":"str","impact":"metric","action":"step"}],'
        '"government_policies":[{"name":"str","scheme_id":"str","benefit":"str","eligibility":"str","apply_url":"url","category":"social|financial|skill|health"}],'
        '"financial_summary":{"monthly_estimate":INT_RUPEES,"growth_trajectory":"growing|stable|declining","risk_level":"low|medium|high"}}\n\n'
        "Provide 4 improvement_tips and 5 government_policies for India "
        "(use real schemes: E-Shram, PM SVANidhi, PMEGP, APY, PMJJBY, PMSBY, PMKVY, NRLM, etc.)."
    )

    try:
        client = get_groq()
        completion = client.chat.completions.create(
            # llama-3.1-8b-instant has its own 500K TPD quota — separate from 70b
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1200,
        )
        raw = completion.choices[0].message.content.strip()

        # Strip markdown code fences the model sometimes adds
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```\s*$",       "", raw, flags=re.MULTILINE)

        result = json.loads(raw)
        return result

    except RateLimitError as e:
        msg = str(e)
        wait = re.search(r"Please try again in ([^.]+)\.", msg)
        wait_str = wait.group(1) if wait else "a few minutes"
        raise HTTPException(
            status_code=429,
            detail=f"AI rate limit. Please try again in {wait_str}."
        )
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI response parse error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")
