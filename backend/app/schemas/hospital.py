from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from app.schemas.common import GeoJSONPoint

class HospitalCreate(BaseModel):
    name: str
    location: GeoJSONPoint
    total_beds: int
    available_beds: int
    phone: str

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[GeoJSONPoint] = None
    total_beds: Optional[int] = None
    available_beds: Optional[int] = None
    phone: Optional[str] = None

class HospitalResponse(HospitalCreate):
    id: str = Field(..., description="MongoDB string ID")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
