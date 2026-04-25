"""
routes/upload.py
POST /upload  — accepts a file via multipart/form-data,
                saves it to backend/uploads/, and returns its URL.
"""

import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import BACKEND_URL

router = APIRouter(prefix="/upload", tags=["Upload"])

# Absolute path to the uploads folder (sits next to main.py)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_SIZE_MB   = 5


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a single image file.
    Returns { url } pointing to the publicly served static path.
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Only JPEG/PNG/WebP images are allowed. Got: {file.content_type}",
        )

    # Read and size-check
    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_SIZE_MB} MB).")

    # Generate a unique filename so nothing gets overwritten
    ext      = os.path.splitext(file.filename or "upload")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    url = f"{BACKEND_URL.rstrip('/')}/static/uploads/{filename}"
    return {"url": url, "filename": filename}
