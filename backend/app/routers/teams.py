from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from pymongo import ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_database
from app.schemas.team import (
    RescueTeamCreate,
    RescueTeamUpdate,
    RescueTeamResponse,
    ResourceStatusEnum,
)

router = APIRouter()

COLLECTION_NAME = "rescue_teams"

def parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rescue team with id '{id_str}' not found"
        )

def format_team(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@router.post("/", response_model=RescueTeamResponse, status_code=status.HTTP_201_CREATED)
async def create_rescue_team(team: RescueTeamCreate):
    db = get_database()
    team_dict = team.model_dump()
    result = await db[COLLECTION_NAME].insert_one(team_dict)
    created_doc = await db[COLLECTION_NAME].find_one({"_id": result.inserted_id})
    return format_team(created_doc)

@router.get("/", response_model=List[RescueTeamResponse])
async def list_rescue_teams(status: Optional[ResourceStatusEnum] = Query(None, description="Filter by status")):
    db = get_database()
    query = {}
    if status is not None:
        query["status"] = status.value
    cursor = db[COLLECTION_NAME].find(query)
    teams = []
    async for doc in cursor:
        teams.append(format_team(doc))
    return teams

@router.get("/{id}", response_model=RescueTeamResponse)
async def get_rescue_team(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rescue team with id '{id}' not found"
        )
    return format_team(doc)

@router.patch("/{id}", response_model=RescueTeamResponse)
async def update_rescue_team(id: str, payload: RescueTeamUpdate):
    db = get_database()
    obj_id = parse_object_id(id)
    
    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = update_data["status"].value
    if "type" in update_data and update_data["type"] is not None:
        update_data["type"] = update_data["type"].value
        
    if not update_data:
        doc = await db[COLLECTION_NAME].find_one({"_id": obj_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rescue team with id '{id}' not found"
            )
        return format_team(doc)
        
    updated_doc = await db[COLLECTION_NAME].find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rescue team with id '{id}' not found"
        )
    formatted_doc = format_team(updated_doc)
    formatted_doc["resource_type"] = "rescue_team"
    from app.services.ws_manager import ws_manager
    await ws_manager.broadcast("resource_update", formatted_doc)
    return formatted_doc

@router.delete("/{id}")
async def delete_rescue_team(id: str):
    db = get_database()
    obj_id = parse_object_id(id)
    result = await db[COLLECTION_NAME].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rescue team with id '{id}' not found"
        )
    return {"message": f"Rescue team '{id}' deleted successfully", "id": id}
