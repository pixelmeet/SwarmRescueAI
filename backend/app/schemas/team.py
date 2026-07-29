from pydantic import BaseModel, Field, ConfigDict
from typing import List
from enum import Enum
from app.schemas.common import GeoJSONPoint

class TeamTypeEnum(str, Enum):
    FIRE = "fire"
    POLICE = "police"
    MEDICAL = "medical"
    GENERAL = "general"

class ResourceStatusEnum(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

class RescueTeamCreate(BaseModel):
    name: str
    type: TeamTypeEnum = TeamTypeEnum.GENERAL
    location: GeoJSONPoint
    status: ResourceStatusEnum = ResourceStatusEnum.AVAILABLE
    skills: List[str] = Field(default_factory=list)

class RescueTeamResponse(RescueTeamCreate):
    id: str = Field(..., description="MongoDB string ID")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
