import asyncio
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Query
from pymongo import ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId

from pydantic import BaseModel
from app.db.mongo import get_database
from app.services.scoring_engine import find_best_matches
from app.services.severity_classifier import classify_emergency
from app.services.notify import send_notification
from app.services.ws_manager import ws_manager
from app.schemas.request import (
    EmergencyRequestCreate,
    EmergencyRequestUpdate,
    EmergencyRequestResponse,
    RequestStatusEnum,
    SeverityEnum,
    CategoryEnum,
)

router = APIRouter()

COLLECTION_NAME = "emergency_requests"

class ClassifyTestInput(BaseModel):
    description: str

def parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with id '{id_str}' not found"
        )

def format_request(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@router.post("/classify-test")
async def classify_test_endpoint(payload: ClassifyTestInput):
    return await classify_emergency(payload.description)

@router.post("/", response_model=EmergencyRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_request(request_payload: EmergencyRequestCreate):
    db = get_database()
    req_dict = request_payload.model_dump()

    if req_dict.get("severity") is None or req_dict.get("category") is None:
        classification = await classify_emergency(request_payload.description)
        if req_dict.get("severity") is None:
            req_dict["severity"] = classification["severity"]
        if req_dict.get("category") is None:
            req_dict["category"] = classification["category"]
        if not req_dict.get("required_skills"):
            req_dict["required_skills"] = classification.get("required_skills", [])
        if req_dict.get("reasoning") is None:
            req_dict["reasoning"] = classification.get("reasoning", "")

    if isinstance(req_dict.get("severity"), SeverityEnum):
        req_dict["severity"] = req_dict["severity"].value
    if isinstance(req_dict.get("category"), CategoryEnum):
        req_dict["category"] = req_dict["category"].value
    if isinstance(req_dict.get("status"), RequestStatusEnum):
        req_dict["status"] = req_dict["status"].value

    req_dict["created_at"] = datetime.utcnow()
    result = await db[COLLECTION_NAME].insert_one(req_dict)
    created_doc = await db[COLLECTION_NAME].find_one({"_id": result.inserted_id})
    formatted_doc = format_request(created_doc)

    # Broadcast real-time WebSocket event
    await ws_manager.broadcast("new_request", formatted_doc)

    # Send non-blocking confirmation email to reporter if email exists
    reporter_email = created_doc.get("reporter_email")
    if reporter_email:
        req_id_str = str(created_doc.get("_id", ""))
        reporter_name = created_doc.get("reporter_name", "Citizen")
        severity = created_doc.get("severity", "medium")
        category = created_doc.get("category", "other")
        description = created_doc.get("description", "")

        subject = f"[SwarmRescue AI] Emergency Request Confirmation - ID: {req_id_str}"
        text = (
            f"Hello {reporter_name},\n\n"
            f"Your emergency request has been received by SwarmRescue AI.\n\n"
            f"Request ID: {req_id_str}\n"
            f"Classified Severity: {severity}\n"
            f"Category: {category}\n"
            f"Description: {description}\n\n"
            f"Our rescue teams have been notified and are processing your request."
        )
        asyncio.create_task(send_notification(to=reporter_email, subject=subject, text=text))

    return formatted_doc

@router.get("/", response_model=List[EmergencyRequestResponse])
async def list_emergency_requests(status: Optional[RequestStatusEnum] = Query(None, description="Filter by status")):
    db = get_database()
    query = {}
    if status is not None:
        query["status"] = status.value
    cursor = db[COLLECTION_NAME].find(query)
    requests_list = []
    async for doc in cursor:
        requests_list.append(format_request(doc))
    return requests_list

@router.get("/{id}/recommendations")
async def get_request_recommendations(id: str):
    db = get_database()
    return await find_best_matches(db, id)

@router.get("/{id}", response_model=EmergencyRequestResponse)
async def get_emergency_request(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with id '{id}' not found"
        )
    return format_request(doc)

@router.patch("/{id}", response_model=EmergencyRequestResponse)
async def update_emergency_request(id: str, payload: EmergencyRequestUpdate):
    db = get_database()
    obj_id = parse_object_id(id)
    
    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = update_data["status"].value
    if "severity" in update_data and update_data["severity"] is not None:
        update_data["severity"] = update_data["severity"].value
    if "category" in update_data and update_data["category"] is not None:
        update_data["category"] = update_data["category"].value
        
    if not update_data:
        doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Emergency request with id '{id}' not found"
            )
        return format_request(doc)
        
    updated_doc = await db[COLLECTION_NAME].find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with id '{id}' not found"
        )

    formatted_doc = format_request(updated_doc)

    # Broadcast real-time WebSocket event for status update
    await ws_manager.broadcast("status_update", formatted_doc)

    # Send closure email if status updated to "resolved"
    if updated_doc.get("status") == "resolved":
        reporter_email = updated_doc.get("reporter_email")
        if reporter_email:
            req_id_str = str(updated_doc.get("_id", id))
            reporter_name = updated_doc.get("reporter_name", "Citizen")
            subject = f"[SwarmRescue AI] Emergency Request Resolved - ID: {req_id_str}"
            text = (
                f"Hello {reporter_name},\n\n"
                f"Your emergency request (ID: {req_id_str}) has been marked as RESOLVED.\n\n"
                f"Thank you for using SwarmRescue AI."
            )
            asyncio.create_task(send_notification(to=reporter_email, subject=subject, text=text))

    return formatted_doc

@router.delete("/{id}")
async def delete_emergency_request(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    result = await db[COLLECTION_NAME].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with id '{id}' not found"
        )
    return {"message": f"Emergency request '{id}' deleted successfully", "id": id}
