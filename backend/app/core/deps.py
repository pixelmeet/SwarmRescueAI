import random
import string
from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from bson import ObjectId

from app.config import settings
from app.core.security import decode_access_token
from app.db.mongo import get_database

security = HTTPBearer()

def generate_access_code(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))

async def verify_internal_secret(x_internal_secret: str = Header(...)):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal secret header",
        )

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token credentials",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
        )

async def verify_resource_access_code(resource_type: str, resource_id: str, access_code: str):
    if not resource_type or not resource_id or not access_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing resource authentication credentials",
        )

    collection_map = {
        "rescue_team": "rescue_teams",
        "ambulance": "ambulances",
        "hospital": "hospitals",
        "volunteer": "volunteers",
    }

    resource_type_norm = resource_type.lower()
    collection_name = collection_map.get(resource_type_norm)
    if not collection_name:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid resource type '{resource_type}'",
        )

    try:
        obj_id = ObjectId(resource_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid resource ID '{resource_id}'",
        )

    db = get_database()
    doc = await db[collection_name].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Resource with ID '{resource_id}' not found in '{collection_name}'",
        )

    doc_code = doc.get("access_code")
    if not doc_code or doc_code != access_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid resource access code",
        )

    return doc


