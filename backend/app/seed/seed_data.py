"""
Seed script to insert dummy teams, hospitals, and volunteers into MongoDB.
"""
import asyncio
from app.db.mongo import get_database, connect_to_mongo, close_mongo_connection

DUMMY_TEAMS = [
    {
        "name": "Alpha Rescue Unit",
        "capacity": 5,
        "location": {"type": "Point", "coordinates": [77.5946, 12.9716]},
        "is_available": True,
    },
    {
        "name": "Bravo Disaster Team",
        "capacity": 4,
        "location": {"type": "Point", "coordinates": [77.6000, 12.9800]},
        "is_available": True,
    },
]

DUMMY_HOSPITALS = [
    {
        "name": "City General Hospital",
        "icu_beds_available": 12,
        "general_beds_available": 45,
        "location": {"type": "Point", "coordinates": [77.5900, 12.9650]},
    }
]

DUMMY_VOLUNTEERS = [
    {
        "name": "John Doe",
        "phone": "+1555123456",
        "skills": ["first_aid", "swimmer"],
        "location": {"type": "Point", "coordinates": [77.5920, 12.9730]},
        "is_active": True,
    }
]

async def seed():
    await connect_to_mongo()
    db = get_database()
    
    await db.teams.delete_many({})
    await db.teams.insert_many(DUMMY_TEAMS)
    
    await db.hospitals.delete_many({})
    await db.hospitals.insert_many(DUMMY_HOSPITALS)
    
    await db.volunteers.delete_many({})
    await db.volunteers.insert_many(DUMMY_VOLUNTEERS)
    
    print("Seed data populated successfully.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed())
