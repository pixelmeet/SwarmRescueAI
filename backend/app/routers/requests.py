from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Query
from pymongo import ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_database
from app.schemas.request import (
    EmergencyRequestCreate,
    EmergencyRequestUpdate,
    EmergencyRequestResponse,
    RequestStatusEnum,
)

router = APIRouter()

COLLECTION_NAME = "emergency_requests"

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

@router.post("/", response_model=EmergencyRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_request(request_payload: EmergencyRequestCreate):
    db = get_database()
    req_dict = request_payload.model_dump()
    req_dict["created_at"] = datetime.utcnow()
    result = await db[COLLECTION_NAME].insert_one(req_dict)
    created_doc = await db[COLLECTION_NAME].find_one({"_id": result.inserted_id})
    return format_request(created_doc)

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
    return format_request(updated_doc)

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
