from fastapi import APIRouter
from app.schemas.assignment import AssignmentCreate

router = APIRouter()

@router.post("/auto-assign")
async def auto_assign():
    return {"message": "Auto-assignment scoring engine executed", "assignments": []}

@router.post("/manual-override")
async def manual_override(assignment: AssignmentCreate):
    return {"message": "Manual override applied", "assignment": assignment.model_dump()}
