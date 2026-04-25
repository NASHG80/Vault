"""
matching_service.py
Fetches available workers from MongoDB, extracts ML features, scores each
candidate with the Logistic Regression model, and returns them ranked by
predicted job-success probability.

Filtering strategy:
  - Structured skills (chip filter):  hard exclude workers with 0 overlap.
  - Free-text query (typed prompt):   hard exclude workers whose skills/role
    contain none of the query words — so typing "warehousing" returns only
    workers who have that word in their skills or role.
  - No filter at all: return all available workers ranked by ML score.
"""

from bson import ObjectId
from app.db.mongo import workers, users
from app.services.ai_service import predict


# ─── Feature helpers ─────────────────────────────────────────────────────────

def _compute_skill_score(worker_skills: list, query_skills: list) -> float:
    """Jaccard-style overlap: |intersection| / |query|.  Returns 1.0 if no query skills."""
    if not query_skills:
        return 1.0
    intersection = len(set(worker_skills) & set(query_skills))
    return intersection / max(len(query_skills), 1)


def _text_matches(worker: dict, text_terms: list) -> bool:
    """
    Returns True if ANY of the text_terms appear (case-insensitive substring)
    in the worker's skills list, role, or location.
    Used as a hard filter for free-text prompt searches.
    """
    if not text_terms:
        return True

    # Build a single searchable string from all worker text fields
    searchable = " ".join([
        " ".join(worker.get("skills", [])),
        worker.get("role", ""),
        worker.get("location", ""),
    ]).lower()

    return any(term in searchable for term in text_terms)


def _resolve_name(worker_doc: dict) -> str:
    """Look up the linked user document and return their display name."""
    uid = worker_doc.get("user_id")
    if not uid:
        return "Unknown Worker"
    try:
        obj_id = ObjectId(str(uid))
        user_doc = users.find_one({"_id": obj_id})
        return user_doc.get("name", "Unknown Worker") if user_doc else "Unknown Worker"
    except Exception:
        return "Unknown Worker"


# ─── Main matching function ───────────────────────────────────────────────────

def match_workers(query: dict) -> list:
    """
    Args:
        query: {
            "skills":     [...],   # structured chip/filter skills
            "location":   "...",
            "text_query": [...],   # free-text words from natural-language prompt
        }

    Returns:
        List of ranked worker dicts, sorted by `score` descending.
    """
    query_skills   = [s.strip().lower() for s in query.get("skills", [])]
    query_location = query.get("location", "").strip().lower()
    text_terms     = [t.strip().lower() for t in query.get("text_query", [])]

    results = []

    for w in workers.find({"available": True}):
        name = _resolve_name(w)

        # ── Feature 1: skill overlap ──────────────────────────────────────────
        worker_skills_raw = w.get("skills", [])
        worker_skills     = [s.strip().lower() for s in worker_skills_raw]
        skill_score       = _compute_skill_score(worker_skills, query_skills)

        # ── Hard filter A: structured skill chips ─────────────────────────────
        # If the user selected skill chips, exclude workers with zero overlap.
        if query_skills and skill_score == 0.0:
            continue

        # ── Hard filter B: free-text prompt words ─────────────────────────────
        # If the user typed a prompt (no whitelist match or partial), check
        # that at least one word appears in the worker's skills/role/location.
        # Only apply this when NO structured skills were extracted — avoids
        # double-filtering when a whitelist skill WAS found in the prompt.
        if text_terms and not query_skills:
            if not _text_matches(w, text_terms):
                continue

        # ── Feature 2: trust score ────────────────────────────────────────────
        trust = float(w.get("trust_score", 50.0))

        # ── Feature 3: experience (jobs completed) ────────────────────────────
        exp = float(w.get("jobs_completed", 0))

        # ── Feature 4: acceptance rate ────────────────────────────────────────
        total_req = w.get("total_requests", 0)
        accepted  = w.get("accepted", 0)
        acceptance_rate = (accepted / total_req) if total_req > 0 else 1.0

        # ── Feature 5: location match ─────────────────────────────────────────
        worker_loc = w.get("location", "").strip().lower()
        if not query_location:
            location_match = 1.0
        else:
            location_match = 1.0 if query_location in worker_loc else 0.0

        features = [skill_score, trust, exp, acceptance_rate, location_match]
        score    = predict(features)

        results.append({
            "worker_id":      str(w["_id"]),
            "user_id":        str(w.get("user_id", "")),
            "name":           name,
            "role":           w.get("role", "Verified Worker"),
            "skills":         worker_skills_raw,
            "trust_score":    trust,
            "rating":         float(w.get("rating", 0.0)),
            "jobs_completed": int(exp),
            "location":       w.get("location", ""),
            "available":      w.get("available", True),
            "verified":       w.get("verified", False),
            "score":          round(score * 100, 1),
            "match":          int(round(score * 100)),
        })

    return sorted(results, key=lambda x: x["score"], reverse=True)