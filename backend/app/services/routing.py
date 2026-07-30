import logging
import math
import httpx
from typing import Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger("uvicorn")

# Note: The public OSRM demo server (router.project-osrm.org) is free but rate-limited
# and not for production use — for the project demo this is fine, but self-hosting
# OSRM via Docker is the documented next step if scaling is needed.

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates straight-line distance in kilometers between two lat/lng coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def _build_fallback_route(lat1: float, lng1: float, lat2: float, lng2: float) -> Dict[str, Any]:
    """Generates a straight-line fallback route if OSRM is unreachable or rate-limited."""
    dist_km = round(haversine_distance_km(lat1, lng1, lat2, lng2), 2)
    # Estimate speed at ~30 km/h in urban emergency scenario
    duration_min = round((dist_km / 30.0) * 60.0, 1)
    return {
        "distance_km": dist_km,
        "duration_minutes": duration_min,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [lng1, lat1],
                [lng2, lat2]
            ]
        }
    }

async def get_route(origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict[str, Any]:
    """
    Fetches real road routing data from the OSRM API service.
    
    :param origin: (lat, lng) tuple of origin point
    :param destination: (lat, lng) tuple of destination point
    :return: dict with keys: distance_km, duration_minutes, geometry (GeoJSON LineString)
    """
    lat1, lng1 = origin[0], origin[1]
    lat2, lng2 = destination[0], destination[1]

    base_url = settings.OSRM_BASE_URL.rstrip("/")
    url = f"{base_url}/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                logger.warning(f"OSRM service returned HTTP status {resp.status_code}. Falling back to straight-line route.")
                return _build_fallback_route(lat1, lng1, lat2, lng2)

            data = resp.json()
            routes = data.get("routes", [])
            if not routes:
                logger.warning("OSRM returned response with no routes. Falling back to straight-line route.")
                return _build_fallback_route(lat1, lng1, lat2, lng2)

            first_route = routes[0]
            dist_meters = first_route.get("distance", 0.0)
            duration_sec = first_route.get("duration", 0.0)
            geometry = first_route.get("geometry", {
                "type": "LineString",
                "coordinates": [[lng1, lat1], [lng2, lat2]]
            })

            return {
                "distance_km": round(dist_meters / 1000.0, 2),
                "duration_minutes": round(duration_sec / 60.0, 1),
                "geometry": geometry,
            }
    except Exception as exc:
        logger.warning(f"Error fetching OSRM route: {exc}. Falling back to straight-line route.")
        return _build_fallback_route(lat1, lng1, lat2, lng2)

# Backward-compatibility alias if needed
async def calculate_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> dict:
    return await get_route((start_lat, start_lng), (end_lat, end_lng))
