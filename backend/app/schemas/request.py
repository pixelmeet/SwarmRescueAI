from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class GeoLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

class EmergencyRequestCreate(BaseModel):
    description: str
    latitude: float
    longitude: float
    contact_phone: Optional[str] = None

class EmergencyRequestResponse(BaseModel):
    id: str
    description: str
    location: GeoLocation
    severity: str = "pending"
    status: str = "submitted"
    created_at: datetime = Field(default_factory=datetime.utcnow)
