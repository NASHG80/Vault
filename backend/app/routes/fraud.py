"""
routes/fraud.py
Image fraud detection endpoint.
Uses Sightengine API to detect AI-generated images.
"""

import os
import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])

SIGHTENGINE_USER = os.getenv("SIGHTENGINE_USER", "")
SIGHTENGINE_SECRET = os.getenv("SIGHTENGINE_SECRET", "")


@router.post("/check")
async def check_image_fraud(media: UploadFile = File(...)):
    """
    Accepts an uploaded image and checks if it is AI-generated
    using the Sightengine API.
    """
    if not SIGHTENGINE_USER or not SIGHTENGINE_SECRET:
        return {
            "is_fraud": False,
            "confidence": 0.0,
            "reason": "Fraud detection not configured — image unverified",
            "allow_submit": True,
            "status": "unverified",
        }

    contents = await media.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.sightengine.com/1.0/check.json",
                data={
                    "models": "genai",
                    "api_user": SIGHTENGINE_USER,
                    "api_secret": SIGHTENGINE_SECRET,
                },
                files={
                    "media": (media.filename or "image.jpg", contents, media.content_type or "image/jpeg"),
                },
            )
            data = response.json()
    except Exception as e:
        return {
            "is_fraud": False,
            "confidence": 0.0,
            "reason": f"Fraud check unavailable: {str(e)}",
            "allow_submit": True,
            "status": "error",
        }

    if data.get("status") != "success":
        return {
            "is_fraud": False,
            "confidence": 0.0,
            "reason": f"API error: {data.get('error', {}).get('message', 'Unknown')}",
            "allow_submit": True,
            "status": "error",
        }

    ai_score = data.get("type", {}).get("ai_generated", 0.0)
    threshold = 0.5

    if ai_score > threshold:
        return {
            "is_fraud": True,
            "confidence": round(ai_score, 3),
            "reason": f"AI-Generated Image Detected (confidence: {round(ai_score * 100)}%)",
            "allow_submit": False,
            "status": "fraud",
        }
    else:
        return {
            "is_fraud": False,
            "confidence": round(1.0 - ai_score, 3),
            "reason": "Image appears authentic",
            "allow_submit": True,
            "status": "clean",
        }
