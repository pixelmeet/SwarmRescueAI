from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
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
    access_code: Optional[str] = None

class RescueTeamUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[TeamTypeEnum] = None
    location: Optional[GeoJSONPoint] = None
    status: Optional[ResourceStatusEnum] = None
    skills: Optional[List[str]] = None
    access_code: Optional[str] = None

class RescueTeamResponse(RescueTeamCreate):
    id: str = Field(..., description="MongoDB string ID")
    access_code: str = Field(..., description="6-character access code")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
