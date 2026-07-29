from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum
from app.schemas.common import GeoJSONPoint

class SeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CategoryEnum(str, Enum):
    FIRE = "fire"
    MEDICAL = "medical"
    TRAPPED = "trapped"
    FLOOD = "flood"
    OTHER = "other"

class RequestStatusEnum(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    EN_ROUTE = "en_route"
    RESOLVED = "resolved"

class EmergencyRequestCreate(BaseModel):
    description: str
    location: GeoJSONPoint
    severity: SeverityEnum = SeverityEnum.MEDIUM
    category: CategoryEnum = CategoryEnum.OTHER
    status: RequestStatusEnum = RequestStatusEnum.PENDING
    reporter_email: str
    reporter_name: str

class EmergencyRequestResponse(EmergencyRequestCreate):
    id: str = Field(..., description="MongoDB string ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
