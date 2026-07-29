from pydantic import BaseModel
from typing import List, Optional

class RescueTeamBase(BaseModel):
    name: str
    capacity: int = 4
    latitude: float
    longitude: float
    is_available: bool = True

class RescueTeamResponse(RescueTeamBase):
    id: str
