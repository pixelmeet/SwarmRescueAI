import asyncio
from datetime import datetime
from enum import Enum
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_database
from app.services.notify import send_notification
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    ResourceTypeEnum,
    AssignmentStatusEnum,
)

router = APIRouter()

COLLECTION_MAP = {
    ResourceTypeEnum.RESCUE_TEAM: "rescue_teams",
    ResourceTypeEnum.AMBULANCE: "ambulances",
    ResourceTypeEnum.HOSPITAL: "hospitals",
    ResourceTypeEnum.VOLUNTEER: "volunteers",
    "rescue_team": "rescue_teams",
    "ambulance": "ambulances",
    "hospital": "hospitals",
    "volunteer": "volunteers",
}

@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(payload: AssignmentCreate):
    db = get_database()

    # 1. Validate Emergency Request
    try:
        req_obj_id = ObjectId(payload.request_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with id '{payload.request_id}' not found"
        )

    req_doc = await db["emergency_requests"].find_one({"_id": req_obj_id})
    if not req_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with id '{payload.request_id}' not found"
        )

    # 2. Determine collection & validate Resource
    resource_type_str = payload.resource_type.value if isinstance(payload.resource_type, Enum) else str(payload.resource_type)
    collection_name = COLLECTION_MAP.get(payload.resource_type) or COLLECTION_MAP.get(resource_type_str)
    if not collection_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid resource_type '{payload.resource_type}'"
        )

    try:
        res_obj_id = ObjectId(payload.resource_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with id '{payload.resource_id}' not found in '{collection_name}'"
        )

    res_doc = await db[collection_name].find_one({"_id": res_obj_id})
    if not res_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with id '{payload.resource_id}' not found in '{collection_name}'"
        )

    # 3. Reserve resource (decrement hospital beds or set status to busy)
    if collection_name == "hospitals":
        update_result = await db["hospitals"].update_one(
            {"_id": res_obj_id, "available_beds": {"$gt": 0}},
            {"$inc": {"available_beds": -1}}
        )
        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No available beds at this hospital"
            )
    else:
        await db[collection_name].update_one({"_id": res_obj_id}, {"$set": {"status": "busy"}})

    # 4. Create Assignment document
    now = datetime.utcnow()
    status_val = payload.status.value if isinstance(payload.status, Enum) else str(payload.status)
    assignment_doc = {
        "request_id": payload.request_id,
        "resource_type": resource_type_str,
        "resource_id": payload.resource_id,
        "eta_minutes": payload.eta_minutes,
        "status": status_val,
        "assigned_at": now,
    }

    result = await db["assignments"].insert_one(assignment_doc)
    assignment_doc["id"] = str(result.inserted_id)

    # 5. Flip emergency request status to "assigned"
    await db["emergency_requests"].update_one({"_id": req_obj_id}, {"$set": {"status": "assigned"}})

    # 6. Send notification email to assigned resource if email exists
    resource_email = res_doc.get("email") or res_doc.get("contact_email") or res_doc.get("driver_email")
    if resource_email:
        req_id_str = payload.request_id
        req_desc = req_doc.get("description", "N/A")
        req_loc = req_doc.get("location", {})
        coords = req_loc.get("coordinates", []) if isinstance(req_loc, dict) else []
        loc_str = f"Coordinates {coords}" if coords else "Emergency location"

        subject = f"[SwarmRescue AI] New Emergency Assignment - Request ID: {req_id_str}"
        text = (
            f"You have been assigned to an emergency request.\n\n"
            f"Request ID: {req_id_str}\n"
            f"Resource Type: {resource_type_str}\n"
            f"Location: {loc_str}\n"
            f"Description: {req_desc}\n"
            f"ETA: {payload.eta_minutes} minutes\n\n"
            f"Please respond as soon as possible."
        )
        asyncio.create_task(send_notification(to=resource_email, subject=subject, text=text))

    return assignment_doc

@router.post("/auto-assign")
async def auto_assign():
    return {"message": "Auto-assignment scoring engine executed", "assignments": []}

@router.post("/manual-override")
async def manual_override(assignment: AssignmentCreate):
    return {"message": "Manual override applied", "assignment": assignment.model_dump()}
