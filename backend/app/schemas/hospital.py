from pydantic import BaseModel

class HospitalBase(BaseModel):
    name: str
    icu_beds_available: int
    general_beds_available: int
    latitude: float
    longitude: float

class HospitalResponse(HospitalBase):
    id: str
