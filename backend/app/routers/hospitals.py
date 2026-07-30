from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from pymongo import ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_database
from app.schemas.hospital import (
    HospitalCreate,
    HospitalUpdate,
    HospitalResponse,
)

router = APIRouter()

COLLECTION_NAME = "hospitals"

def parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with id '{id_str}' not found"
        )

def format_hospital(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@router.post("/", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
async def create_hospital(hospital: HospitalCreate):
    db = get_database()
    hosp_dict = hospital.model_dump()
    result = await db[COLLECTION_NAME].insert_one(hosp_dict)
    created_doc = await db[COLLECTION_NAME].find_one({"_id": result.inserted_id})
    return format_hospital(created_doc)

@router.get("/", response_model=List[HospitalResponse])
async def list_hospitals(status: Optional[str] = Query(None, description="Optional status query filter")):
    db = get_database()
    query = {}
    if status is not None:
        query["status"] = status
    cursor = db[COLLECTION_NAME].find(query)
    hospitals = []
    async for doc in cursor:
        hospitals.append(format_hospital(doc))
    return hospitals

@router.get("/{id}", response_model=HospitalResponse)
async def get_hospital(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with id '{id}' not found"
        )
    return format_hospital(doc)

@router.patch("/{id}", response_model=HospitalResponse)
async def update_hospital(id: str, payload: HospitalUpdate):
    db = get_database()
    obj_id = parse_object_id(id)
    
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Hospital with id '{id}' not found"
            )
        return format_hospital(doc)
        
    updated_doc = await db[COLLECTION_NAME].find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with id '{id}' not found"
        )
    return format_hospital(updated_doc)

@router.delete("/{id}")
async def delete_hospital(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    result = await db[COLLECTION_NAME].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with id '{id}' not found"
        )
    return {"message": f"Hospital '{id}' deleted successfully", "id": id}
