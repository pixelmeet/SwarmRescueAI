from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from pymongo import ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_database
from app.core.deps import get_current_admin, generate_access_code
from app.schemas.volunteer import (
    VolunteerCreate,
    VolunteerUpdate,
    VolunteerResponse,
    ResourceStatusEnum,
)

router = APIRouter()

COLLECTION_NAME = "volunteers"

def parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Volunteer with id '{id_str}' not found"
        )

def format_volunteer(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@router.post("/", response_model=VolunteerResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer(volunteer: VolunteerCreate, admin: dict = Depends(get_current_admin)):
    db = get_database()
    vol_dict = volunteer.model_dump()
    if not vol_dict.get("access_code"):
        vol_dict["access_code"] = generate_access_code()
    result = await db[COLLECTION_NAME].insert_one(vol_dict)
    created_doc = await db[COLLECTION_NAME].find_one({"_id": result.inserted_id})
    return format_volunteer(created_doc)

@router.get("/", response_model=List[VolunteerResponse])
async def list_volunteers(status: Optional[ResourceStatusEnum] = Query(None, description="Filter by status")):
    db = get_database()
    query = {}
    if status is not None:
        query["status"] = status.value
    cursor = db[COLLECTION_NAME].find(query)
    volunteers = []
    async for doc in cursor:
        volunteers.append(format_volunteer(doc))
    return volunteers

@router.get("/{id}", response_model=VolunteerResponse)
async def get_volunteer(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Volunteer with id '{id}' not found"
        )
    return format_volunteer(doc)

@router.patch("/{id}", response_model=VolunteerResponse)
async def update_volunteer(id: str, payload: VolunteerUpdate, admin: dict = Depends(get_current_admin)):
    db = get_database()
    obj_id = parse_object_id(id)
    
    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = update_data["status"].value
        
    if not update_data:
        doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Volunteer with id '{id}' not found"
            )
        return format_volunteer(doc)
        
    updated_doc = await db[COLLECTION_NAME].find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Volunteer with id '{id}' not found"
        )
    formatted_doc = format_volunteer(updated_doc)
    formatted_doc["resource_type"] = "volunteer"
    from app.services.ws_manager import ws_manager
    await ws_manager.broadcast("resource_update", formatted_doc)
    return formatted_doc

@router.delete("/{id}")
async def delete_volunteer(id: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    obj_id = parse_object_id(id)
    result = await db[COLLECTION_NAME].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Volunteer with id '{id}' not found"
        )
    return {"message": f"Volunteer '{id}' deleted successfully", "id": id}
