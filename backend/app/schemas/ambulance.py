from pydantic import BaseModel, Field, ConfigDict
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

class AmbulanceResponse(AmbulanceCreate):
    id: str = Field(..., description="MongoDB string ID")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
