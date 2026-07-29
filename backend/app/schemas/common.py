from pydantic import BaseModel, Field
from typing import Literal, List

class GeoJSONPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(..., description="[longitude, latitude]", min_items=2, max_items=2)
