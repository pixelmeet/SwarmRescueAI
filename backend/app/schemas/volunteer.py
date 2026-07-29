from pydantic import BaseModel

class VolunteerBase(BaseModel):
    name: str
    phone: str
    skills: list[str] = []
    latitude: float
    longitude: float
    is_active: bool = True

class VolunteerResponse(VolunteerBase):
    id: str
