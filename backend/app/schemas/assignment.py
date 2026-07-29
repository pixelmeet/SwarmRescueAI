from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class ResourceTypeEnum(str, Enum):
    RESCUE_TEAM = "rescue_team"
    AMBULANCE = "ambulance"
    HOSPITAL = "hospital"
    VOLUNTEER = "volunteer"

class AssignmentStatusEnum(str, Enum):
    ASSIGNED = "assigned"
    EN_ROUTE = "en_route"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AssignmentCreate(BaseModel):
    request_id: str
    resource_type: ResourceTypeEnum
    resource_id: str
    eta_minutes: Optional[int] = None
    status: AssignmentStatusEnum = AssignmentStatusEnum.ASSIGNED

class AssignmentResponse(AssignmentCreate):
    id: str = Field(..., description="MongoDB string ID")
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
