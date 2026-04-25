from fastapi import APIRouter
from app.services.matching_service import match_workers

router = APIRouter(prefix="/match")

@router.post("/")
def match(data: dict):
    return match_workers(data)