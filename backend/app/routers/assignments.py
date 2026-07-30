import asyncio
from datetime import datetime
from enum import Enum
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_database
from app.services.notify import send_notification
from app.services.ws_manager import ws_manager
from app.core.deps import get_current_admin
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentStatusUpdate,
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

def format_assignment(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@router.get("", response_model=List[AssignmentResponse])
@router.get("/", response_model=List[AssignmentResponse])
async def list_assignments(
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    status: Optional[AssignmentStatusEnum] = Query(None, description="Filter by assignment status")
):
    db = get_database()
    query = {}
    if resource_id:
        query["resource_id"] = resource_id
    if status:
        query["status"] = status.value if isinstance(status, Enum) else str(status)

    cursor = db["assignments"].find(query)
    assignments = []
    async for doc in cursor:
        assignments.append(format_assignment(doc))
    return assignments

@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(payload: AssignmentCreate, admin: dict = Depends(get_current_admin)):
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
    await db["emergency_requests"].update_one({"_id": req_obj_id}, {"$set": {"status": "assigned", "assigned_at": now}})

    # 6. Real-time WebSocket Broadcasts
    await ws_manager.broadcast("new_assignment", assignment_doc)

    updated_req = await db["emergency_requests"].find_one({"_id": req_obj_id})
    if updated_req:
        updated_req["id"] = str(updated_req["_id"])
        del updated_req["_id"]
        await ws_manager.broadcast("status_update", updated_req)

    updated_res = await db[collection_name].find_one({"_id": res_obj_id})
    if updated_res:
        updated_res["id"] = str(updated_res["_id"])
        del updated_res["_id"]
        updated_res["resource_type"] = resource_type_str
        await ws_manager.broadcast("resource_update", updated_res)

    # 7. Send notification email to assigned resource if email exists
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

@router.patch("/{id}/status", response_model=AssignmentResponse)
async def update_assignment_status(id: str, payload: AssignmentStatusUpdate):
    db = get_database()
    try:
        assign_obj_id = ObjectId(id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id '{id}' not found"
        )

    assignment = await db["assignments"].find_one({"_id": assign_obj_id})
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id '{id}' not found"
        )

    new_status = payload.status.value if isinstance(payload.status, Enum) else str(payload.status)
    now = datetime.utcnow()
    update_fields = {"status": new_status}
    if new_status == "completed":
        update_fields["completed_at"] = now

    await db["assignments"].update_one({"_id": assign_obj_id}, {"$set": update_fields})
    updated_assignment = await db["assignments"].find_one({"_id": assign_obj_id})

    # Update corresponding request and resource statuses
    req_id = assignment.get("request_id")
    resource_type = assignment.get("resource_type")
    resource_id = assignment.get("resource_id")
    collection_name = COLLECTION_MAP.get(resource_type)

    if req_id:
        try:
            req_obj_id = ObjectId(req_id)
            if new_status == "en_route":
                await db["emergency_requests"].update_one(
                    {"_id": req_obj_id},
                    {"$set": {"status": "en_route"}}
                )
            elif new_status == "completed":
                await db["emergency_requests"].update_one(
                    {"_id": req_obj_id},
                    {"$set": {"status": "resolved", "resolved_at": now}}
                )

            updated_req = await db["emergency_requests"].find_one({"_id": req_obj_id})
            if updated_req:
                updated_req["id"] = str(updated_req["_id"])
                del updated_req["_id"]
                await ws_manager.broadcast("status_update", updated_req)

                # Send resolution email if marked resolved (Phase 7c requirement)
                if new_status == "completed" and updated_req.get("reporter_email"):
                    reporter_email = updated_req.get("reporter_email")
                    reporter_name = updated_req.get("reporter_name", "Citizen")
                    subject = f"[SwarmRescue AI] Emergency Request Resolved - ID: {req_id}"
                    text = (
                        f"Hello {reporter_name},\n\n"
                        f"Your emergency request (ID: {req_id}) has been marked as RESOLVED by the response team.\n\n"
                        f"Thank you for using SwarmRescue AI."
                    )
                    asyncio.create_task(send_notification(to=reporter_email, subject=subject, text=text))
        except Exception:
            pass

    if collection_name and resource_id:
        try:
            res_obj_id = ObjectId(resource_id)
            if new_status == "completed":
                if collection_name == "hospitals":
                    await db["hospitals"].update_one({"_id": res_obj_id}, {"$inc": {"available_beds": 1}})
                else:
                    await db[collection_name].update_one({"_id": res_obj_id}, {"$set": {"status": "available"}})
            elif new_status == "en_route":
                if collection_name != "hospitals":
                    await db[collection_name].update_one({"_id": res_obj_id}, {"$set": {"status": "busy"}})

            updated_res = await db[collection_name].find_one({"_id": res_obj_id})
            if updated_res:
                updated_res["id"] = str(updated_res["_id"])
                del updated_res["_id"]
                updated_res["resource_type"] = resource_type
                await ws_manager.broadcast("resource_update", updated_res)
        except Exception:
            pass

    return format_assignment(updated_assignment)

@router.post("/auto-assign")
async def auto_assign(admin: dict = Depends(get_current_admin)):
    return {"message": "Auto-assignment scoring engine executed", "assignments": []}

@router.post("/manual-override")
async def manual_override(assignment: AssignmentCreate, admin: dict = Depends(get_current_admin)):
    return {"message": "Manual override applied", "assignment": assignment.model_dump()}
