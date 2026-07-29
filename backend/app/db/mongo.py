from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None

db_container = MongoDB()

async def connect_to_mongo():
    db_container.client = AsyncIOMotorClient(settings.MONGO_URI)

async def close_mongo_connection():
    if db_container.client:
        db_container.client.close()

def get_database():
    return db_container.client[settings.MONGO_DB_NAME]
