from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AssignmentCreate(BaseModel):
    request_id: str
    team_id: Optional[str] = None
    ambulance_id: Optional[str] = None
    hospital_id: Optional[str] = None
    notes: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: str
    request_id: str
    assigned_team_id: Optional[str] = None
    assigned_ambulance_id: Optional[str] = None
    assigned_hospital_id: Optional[str] = None
    assigned_at: datetime
    status: str = "assigned"
