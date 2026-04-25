from pydantic import BaseModel

class JobRequestCreateSchema(BaseModel):
    hirer_id: str
    worker_id: str
    job_title: str
    description: str
    payment: float
    location: str


class JobRequestUpdateSchema(BaseModel):
    request_id: str
    status: str  # pending / accepted / rejected / completed