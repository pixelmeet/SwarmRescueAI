from pydantic import BaseModel, Field, ConfigDict
from app.schemas.common import GeoJSONPoint

class HospitalCreate(BaseModel):
    name: str
    location: GeoJSONPoint
    total_beds: int
    available_beds: int
    phone: str

class HospitalResponse(HospitalCreate):
    id: str = Field(..., description="MongoDB string ID")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
