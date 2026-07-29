from pydantic import BaseModel

class AmbulanceBase(BaseModel):
    vehicle_number: str
    latitude: float
    longitude: float
    is_available: bool = True

class AmbulanceResponse(AmbulanceBase):
    id: str
