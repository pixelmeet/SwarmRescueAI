from fastapi import APIRouter
from app.schemas.request import EmergencyRequestCreate

router = APIRouter()

@router.get("/")
async def list_emergency_requests():
    return {"message": "List emergency requests endpoint placeholder", "requests": []}

@router.post("/")
async def create_emergency_request(payload: EmergencyRequestCreate):
    return {"message": "Emergency request submitted", "data": payload.model_dump()}

@router.get("/{request_id}")
async def get_emergency_request(request_id: str):
    return {"request_id": request_id, "status": "pending"}
