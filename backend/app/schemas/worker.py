from pydantic import BaseModel
from typing import List

class WorkerCreateSchema(BaseModel):
    user_id: str
    skills: List[str]
    location: str
    rating: float = 0
    jobs_completed: int = 0
    trust_score: float = 50
    available: bool = True


class WorkerResponseSchema(BaseModel):
    worker_id: str
    skills: List[str]
    rating: float
    trust_score: float
    location: str