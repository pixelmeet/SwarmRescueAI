import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger("uvicorn")

TARGET_COLLECTIONS = [
    "rescue_teams",
    "ambulances",
    "hospitals",
    "volunteers",
    "emergency_requests",
]

async def ensure_indexes(db: AsyncIOMotorDatabase):
    """
    Creates a 2dsphere index on the `location` field for all required collections.
    """
    logger.info("Initializing 2dsphere geospatial indexes across collections...")
    for collection_name in TARGET_COLLECTIONS:
        try:
            collection = db[collection_name]
            index_name = await collection.create_index([("location", "2dsphere")])
            logger.info(f"2dsphere index '{index_name}' successfully ensured on collection '{collection_name}'.")
        except Exception as e:
            logger.error(f"Failed to create 2dsphere index on collection '{collection_name}': {e}")
            raise e
