from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
async def login():
    return {"access_token": "placeholder_jwt_token", "token_type": "bearer"}

@router.post("/refresh")
async def refresh_token():
    return {"access_token": "placeholder_refreshed_jwt_token", "token_type": "bearer"}
