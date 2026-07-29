from pydantic import BaseModel, Field, ConfigDict
from typing import List
from enum import Enum
from app.schemas.common import GeoJSONPoint

class ResourceStatusEnum(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

class VolunteerCreate(BaseModel):
    name: str
    email: str
    location: GeoJSONPoint
    skills: List[str] = Field(default_factory=list)
    status: ResourceStatusEnum = ResourceStatusEnum.AVAILABLE

class VolunteerResponse(VolunteerCreate):
    id: str = Field(..., description="MongoDB string ID")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
