import asyncio
import logging
from typing import Dict, List, Any
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.routing import get_route

logger = logging.getLogger("uvicorn")

CATEGORY_SKILL_MAP: Dict[str, List[str]] = {
    "medical": ["medical", "first_aid", "cpr", "nurse", "triage", "advanced_life_support"],
    "trapped": ["trapped", "search_and_rescue", "heavy_lifting", "driver", "first_aid", "drone_operator", "k9_search"],
    "fire": ["fire", "firefighting", "search_and_rescue", "first_aid", "heavy_lifting"],
    "flood": ["flood", "swimmer", "boat_operation", "evacuation", "first_aid", "logistics"],
    "other": ["first_aid", "logistics", "driver", "navigation", "counseling", "translator", "ham_radio"],
}

def get_severity_weight(severity: str) -> float:
    sev_str = str(severity).lower()
    if sev_str == "critical":
        return 1.0
    elif sev_str == "high":
        return 0.7
    elif sev_str == "medium":
        return 0.4
    else:
        return 0.2

def parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with id '{id_str}' not found"
        )

async def find_best_matches(db: AsyncIOMotorDatabase, request_id: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Finds and ranks the top available emergency resources for a given emergency request.
    Uses MongoDB $geoNear aggregation and a weighted scoring formula:
      score = (w1 * (1 / (1 + distance_km))) + (w2 * severity_weight) + (w3 * skill_match_ratio)
      w1 = 0.5, w2 = 0.3, w3 = 0.2
    
    For the top 1-2 candidates per category, computes driving ETA (minutes) and route geometry via OSRM.
    """
    obj_id = parse_object_id(request_id)
    request_doc = await db["emergency_requests"].find_one({"_id": obj_id})
    if not request_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with id '{request_id}' not found"
        )

    req_location = request_doc.get("location")
    if not req_location or "coordinates" not in req_location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Emergency request '{request_id}' missing valid location coordinates"
        )

    req_coords = req_location.get("coordinates", [0.0, 0.0])
    req_lat, req_lng = req_coords[1], req_coords[0]

    category = str(request_doc.get("category", "other")).lower()
    severity = str(request_doc.get("severity", "medium")).lower()
    severity_weight = get_severity_weight(severity)

    req_skills = request_doc.get("required_skills")
    if req_skills and isinstance(req_skills, list):
        target_skills = [s.lower() for s in req_skills]
    else:
        target_skills = CATEGORY_SKILL_MAP.get(category, [category])

    w1, w2, w3 = 0.5, 0.3, 0.2

    async def get_geo_candidates(collection_name: str, base_query: dict) -> List[dict]:
        pipeline = [
            {
                "$geoNear": {
                    "near": req_location,
                    "distanceField": "distance_meters",
                    "spherical": True,
                    "query": base_query
                }
            },
            {"$limit": 5}
        ]
        try:
            cursor = db[collection_name].aggregate(pipeline)
            return await cursor.to_list(length=5)
        except Exception as e:
            logger.error(f"Error during $geoNear aggregation on '{collection_name}': {e}")
            return []

    # 1. Fetch rescue teams
    rescue_team_docs = await get_geo_candidates("rescue_teams", {"status": "available"})
    
    # 2. Fetch ambulances
    ambulance_docs = await get_geo_candidates("ambulances", {"status": "available"})

    # 3. Fetch hospitals (available_beds > 0)
    hospital_docs = await get_geo_candidates("hospitals", {"available_beds": {"$gt": 0}})

    # 4. Fetch volunteers
    volunteer_query = {
        "status": "available",
        "skills": {"$in": target_skills + [category]}
    }
    volunteer_docs = await get_geo_candidates("volunteers", volunteer_query)
    # If no volunteers match specific skills, fallback to all available volunteers
    if not volunteer_docs:
        volunteer_docs = await get_geo_candidates("volunteers", {"status": "available"})

    # Function to rank, structure, and route docs
    async def rank_candidates(docs: List[dict], is_volunteer: bool = False, collection_type: str = "") -> List[dict]:
        ranked = []
        doc_map = {}
        for doc in docs:
            dist_meters = doc.get("distance_meters", 0.0)
            dist_km = dist_meters / 1000.0

            if is_volunteer:
                vol_skills = set([s.lower() for s in doc.get("skills", [])])
                target_skill_set = set(target_skills)
                if target_skill_set:
                    overlap = len(vol_skills.intersection(target_skill_set))
                    skill_match_ratio = min(1.0, max(0.0, overlap / len(target_skill_set)))
                else:
                    skill_match_ratio = 1.0
            else:
                skill_match_ratio = 1.0

            distance_term = 1.0 / (1.0 + dist_km)
            score = (w1 * distance_term) + (w2 * severity_weight) + (w3 * skill_match_ratio)

            if collection_type == "ambulance":
                name = doc.get("driver_name") or doc.get("name") or doc.get("plate_number") or "Ambulance"
            else:
                name = doc.get("name", "Unknown Resource")

            res_id = str(doc["_id"])
            cand_dict = {
                "resource_id": res_id,
                "name": name,
                "distance_km": round(dist_km, 2),
                "score": round(score, 4),
                "eta_minutes": None,
                "route_geometry": None
            }
            ranked.append(cand_dict)
            doc_map[res_id] = doc

        # Sort by score descending
        ranked.sort(key=lambda x: x["score"], reverse=True)

        # For top 1-2 ranked candidates per resource type, calculate OSRM driving route & ETA
        top_candidates = ranked[:2]
        for cand in top_candidates:
            orig_doc = doc_map.get(cand["resource_id"])
            if orig_doc and "location" in orig_doc and "coordinates" in orig_doc["location"]:
                c_coords = orig_doc["location"]["coordinates"]
                c_lat, c_lng = c_coords[1], c_coords[0]
                route_data = await get_route(origin=(c_lat, c_lng), destination=(req_lat, req_lng))
                cand["eta_minutes"] = route_data["duration_minutes"]
                cand["route_geometry"] = route_data["geometry"]
                if route_data.get("distance_km") is not None:
                    cand["distance_km"] = route_data["distance_km"]

        return ranked

    rescue_teams, ambulances, hospitals, volunteers = await asyncio.gather(
        rank_candidates(rescue_team_docs, is_volunteer=False, collection_type="rescue_team"),
        rank_candidates(ambulance_docs, is_volunteer=False, collection_type="ambulance"),
        rank_candidates(hospital_docs, is_volunteer=False, collection_type="hospital"),
        rank_candidates(volunteer_docs, is_volunteer=True, collection_type="volunteer")
    )

    return {
        "rescue_teams": rescue_teams,
        "ambulances": ambulances,
        "hospitals": hospitals,
        "volunteers": volunteers,
    }
