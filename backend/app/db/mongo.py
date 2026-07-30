import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("uvicorn")

class MongoDB:
    client: AsyncIOMotorClient | None = None

db_container = MongoDB()

async def connect_to_mongo() -> bool:
    logger.info(f"Connecting to MongoDB database '{settings.MONGO_DB_NAME}' at {settings.MONGO_URI}...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db_container.client = client
    
    try:
        # Ping database to confirm successful connection
        await client.admin.command("ping")
        logger.info(f"Successfully connected to MongoDB Atlas / Database '{settings.MONGO_DB_NAME}'!")
        return True
    except Exception as e:
        logger.warning(f"MongoDB connection ping warning: {e}. Check if MongoDB is running or update MONGO_URI in .env.")
        return False

async def close_mongo_connection():
    if db_container.client is not None:
        logger.info("Closing MongoDB client connection...")
        db_container.client.close()
        db_container.client = None
        logger.info("MongoDB connection closed successfully.")

def get_database() -> AsyncIOMotorDatabase:
    if db_container.client is None:
        raise RuntimeError("Database client is not initialized.")
    return db_container.client[settings.MONGO_DB_NAME]
