"""
routes/hirer.py
POST /hirer/search  — AI worker discovery endpoint.

Accepts either:
  a) Structured query:  { "skills": ["React", "Node"], "location": "Mumbai" }
  b) Natural language:  { "prompt": "Find me a React developer in Mumbai" }

When a prompt is provided:
  1. A whitelist extractor pulls known skills/locations from the text.
  2. The RAW prompt words are ALSO passed as text_query so the matching
     service can do free-text substring matching on worker skills —
     this handles terms like "warehousing" that aren't in the whitelist.
"""

import re
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.matching_service import match_workers

router = APIRouter(prefix="/hirer", tags=["Hirer"])

# ── Known skill tokens (whitelist for structured extraction) ──────────────────
KNOWN_SKILLS = [
    "react", "node", "nodejs", "python", "django", "fastapi", "flask",
    "javascript", "typescript", "java", "kotlin", "swift", "go", "rust",
    "kubernetes", "docker", "aws", "gcp", "azure", "terraform", "helm",
    "postgresql", "mongodb", "redis", "mysql", "graphql", "rest",
    "figma", "ux", "ui", "user testing", "user research",
    "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "bigquery",
    "solidity", "web3", "evm", "blockchain",
    "ci/cd", "devops", "linux", "nginx",
    "logistics", "fleet", "supply chain",
    "warehousing", "warehouse", "inventory", "fulfilment", "fulfillment",
    "delivery", "courier", "dispatch", "transport", "driver",
]

# Major cities / regions
KNOWN_LOCATIONS = [
    "london", "berlin", "remote", "mumbai", "singapore", "lagos",
    "new york", "paris", "tokyo", "dubai", "bangalore", "delhi",
    "uk", "us", "usa", "india", "germany", "nigeria",
    "chennai", "hyderabad", "pune", "kolkata",
]

# Common filler words to strip before free-text skill matching
STOP_WORDS = {
    "find", "me", "a", "an", "the", "for", "in", "at", "with",
    "who", "has", "have", "can", "and", "or", "is", "are",
    "i", "need", "want", "looking", "skilled", "expert", "developer",
    "engineer", "professional", "worker", "freelancer", "available",
    "senior", "junior", "mid", "level", "remote", "contract",
    "week", "month", "year", "project", "job", "role",
}


def _extract_query(prompt: str) -> dict:
    """
    Extract skills and location from a natural-language prompt.
    Also returns a cleaned `text_query` list of meaningful words
    so the matching service can do free-text search as a fallback.
    """
    lower = prompt.lower()

    # 1. Whitelist-based structured extraction
    skills   = [s for s in KNOWN_SKILLS if s in lower]
    location = next((loc for loc in KNOWN_LOCATIONS if loc in lower), "")

    # 2. Free-text words as fallback for unknown skill terms
    words      = re.split(r"[\s,;]+", lower)
    text_terms = [w for w in words if len(w) > 2 and w not in STOP_WORDS]

    return {
        "skills":     list(dict.fromkeys(skills)),  # deduplicate
        "location":   location,
        "text_query": text_terms,  # passed to matching service for free-text fallback
    }


# ── Request / Response schemas ─────────────────────────────────────────────────

class SearchRequest(BaseModel):
    prompt:   Optional[str]       = None
    skills:   Optional[List[str]] = None
    location: Optional[str]       = None


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("/search")
def search_workers(req: SearchRequest):
    """
    Run AI (ML) matching and return workers ranked by predicted job-success score.
    """
    if req.prompt:
        query = _extract_query(req.prompt)
        # Let explicit caller-provided fields override extracted values
        if req.skills:
            query["skills"] = req.skills
        if req.location:
            query["location"] = req.location
    else:
        query = {
            "skills":     req.skills   or [],
            "location":   req.location or "",
            "text_query": [],
        }

    return match_workers(query)