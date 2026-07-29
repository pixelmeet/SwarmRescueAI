from app.db.mongo import get_database
import logging

logger = logging.getLogger("uvicorn")

async def create_geospatial_indexes():
    db = get_database()
    # 2dsphere index setup placeholder for requests, teams, ambulances, hospitals, volunteers
    try:
        await db.requests.create_index([("location", "2dsphere")])
        await db.teams.create_index([("location", "2dsphere")])
        await db.ambulances.create_index([("location", "2dsphere")])
        await db.hospitals.create_index([("location", "2dsphere")])
        await db.volunteers.create_index([("location", "2dsphere")])
        logger.info("2dsphere geospatial indexes established successfully.")
    except Exception as e:
        logger.warning(f"Could not create 2dsphere indexes (MongoDB may be offline): {e}")
