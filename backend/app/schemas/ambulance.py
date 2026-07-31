from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from enum import Enum
from app.schemas.common import GeoJSONPoint

class ResourceStatusEnum(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

class AmbulanceCreate(BaseModel):
    driver_name: str
    location: GeoJSONPoint
    status: ResourceStatusEnum = ResourceStatusEnum.AVAILABLE
    plate_number: str
    access_code: Optional[str] = None

class AmbulanceUpdate(BaseModel):
    driver_name: Optional[str] = None
    location: Optional[GeoJSONPoint] = None
    status: Optional[ResourceStatusEnum] = None
    plate_number: Optional[str] = None
    access_code: Optional[str] = None

class AmbulanceResponse(AmbulanceCreate):
    id: str = Field(..., description="MongoDB string ID")
    access_code: str = Field(..., description="6-character access code")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
