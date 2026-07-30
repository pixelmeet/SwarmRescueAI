from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from pymongo import ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_database
from app.schemas.ambulance import (
    AmbulanceCreate,
    AmbulanceUpdate,
    AmbulanceResponse,
    ResourceStatusEnum,
)

router = APIRouter()

COLLECTION_NAME = "ambulances"

def parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance with id '{id_str}' not found"
        )

def format_ambulance(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@router.post("/", response_model=AmbulanceResponse, status_code=status.HTTP_201_CREATED)
async def create_ambulance(ambulance: AmbulanceCreate):
    db = get_database()
    amb_dict = ambulance.model_dump()
    result = await db[COLLECTION_NAME].insert_one(amb_dict)
    created_doc = await db[COLLECTION_NAME].find_one({"_id": result.inserted_id})
    return format_ambulance(created_doc)

@router.get("/", response_model=List[AmbulanceResponse])
async def list_ambulances(status: Optional[ResourceStatusEnum] = Query(None, description="Filter by status")):
    db = get_database()
    query = {}
    if status is not None:
        query["status"] = status.value
    cursor = db[COLLECTION_NAME].find(query)
    ambulances = []
    async for doc in cursor:
        ambulances.append(format_ambulance(doc))
    return ambulances

@router.get("/{id}", response_model=AmbulanceResponse)
async def get_ambulance(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance with id '{id}' not found"
        )
    return format_ambulance(doc)

@router.patch("/{id}", response_model=AmbulanceResponse)
async def update_ambulance(id: str, payload: AmbulanceUpdate):
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
                detail=f"Ambulance with id '{id}' not found"
            )
        return format_ambulance(doc)
        
    updated_doc = await db[COLLECTION_NAME].find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance with id '{id}' not found"
        )
        
    formatted_doc = format_ambulance(updated_doc)
    formatted_doc["resource_type"] = "ambulance"
    from app.services.ws_manager import ws_manager
    await ws_manager.broadcast("resource_update", formatted_doc)
    return formatted_doc

@router.delete("/{id}")
async def delete_ambulance(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    result = await db[COLLECTION_NAME].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance with id '{id}' not found"
        )
    return {"message": f"Ambulance '{id}' deleted successfully", "id": id}
