"""
Standalone seed script to populate MongoDB with realistic emergency response data for Mumbai, India.
Run via: python -m app.seed.seed_data
"""
import asyncio
from datetime import datetime
from app.db.mongo import get_database, connect_to_mongo, close_mongo_connection

DUMMY_RESCUE_TEAMS = [
    {
        "name": "Alpha Fire & Rescue Unit",
        "type": "fire",
        "location": {"type": "Point", "coordinates": [72.8350, 18.9300]}, # Colaba
        "status": "available",
        "skills": ["firefighting", "search_and_rescue", "heavy_lifting"],
    },
    {
        "name": "Bravo Medical Response Team",
        "type": "medical",
        "location": {"type": "Point", "coordinates": [72.8400, 19.0170]}, # Dadar
        "status": "available",
        "skills": ["first_aid", "triage", "advanced_life_support"],
    },
    {
        "name": "Charlie Flood Relief Unit",
        "type": "general",
        "location": {"type": "Point", "coordinates": [72.8500, 19.0600]}, # Bandra
        "status": "available",
        "skills": ["swimmer", "boat_operation", "evacuation"],
    },
    {
        "name": "Delta Police Tactical Squad",
        "type": "police",
        "location": {"type": "Point", "coordinates": [72.8700, 19.1170]}, # Andheri
        "status": "busy",
        "skills": ["crowd_control", "k9_search", "navigation"],
    },
    {
        "name": "Echo Disaster Search & Recon",
        "type": "general",
        "location": {"type": "Point", "coordinates": [72.9000, 19.1750]}, # Borivali
        "status": "offline",
        "skills": ["search_and_rescue", "drone_operator", "first_aid"],
    },
]

DUMMY_AMBULANCES = [
    {
        "driver_name": "Ramesh Kumar",
        "plate_number": "MH-01-AB-1234",
        "location": {"type": "Point", "coordinates": [72.8320, 18.9400]}, # Marine Lines
        "status": "available",
    },
    {
        "driver_name": "Suresh Patel",
        "plate_number": "MH-02-CD-5678",
        "location": {"type": "Point", "coordinates": [72.8450, 19.0300]}, # Prabhadevi
        "status": "available",
    },
    {
        "driver_name": "Amit Shah",
        "plate_number": "MH-03-EF-9012",
        "location": {"type": "Point", "coordinates": [72.8600, 19.0750]}, # Santacruz
        "status": "busy",
    },
    {
        "driver_name": "Vijay Singh",
        "plate_number": "MH-04-GH-3456",
        "location": {"type": "Point", "coordinates": [72.8850, 19.1300]}, # Jogeshwari
        "status": "available",
    },
    {
        "driver_name": "Prakash Jadhav",
        "plate_number": "MH-05-IJ-7890",
        "location": {"type": "Point", "coordinates": [72.9100, 19.1900]}, # Dahisar
        "status": "offline",
    },
]

DUMMY_HOSPITALS = [
    {
        "name": "KEM Hospital Parel",
        "location": {"type": "Point", "coordinates": [72.8415, 19.0023]}, # Parel
        "total_beds": 500,
        "available_beds": 45,
        "phone": "+91-22-24107000",
    },
    {
        "name": "Lilavati Hospital Bandra",
        "location": {"type": "Point", "coordinates": [72.8285, 19.0512]}, # Bandra West
        "total_beds": 300,
        "available_beds": 20,
        "phone": "+91-22-26751000",
    },
    {
        "name": "SevenHills Hospital Andheri",
        "location": {"type": "Point", "coordinates": [72.8790, 19.1195]}, # Andheri East
        "total_beds": 1500,
        "available_beds": 120,
        "phone": "+91-22-67676767",
    },
]

DUMMY_VOLUNTEERS = [
    {
        "name": "Aarav Mehta",
        "email": "aarav.m@example.com",
        "location": {"type": "Point", "coordinates": [72.8200, 18.9500]},
        "skills": ["first_aid", "cpr"],
        "status": "available",
    },
    {
        "name": "Ananya Sharma",
        "email": "ananya.s@example.com",
        "location": {"type": "Point", "coordinates": [72.8380, 19.0200]},
        "skills": ["swimmer", "boat_operation"],
        "status": "available",
    },
    {
        "name": "Rohan Gupta",
        "email": "rohan.g@example.com",
        "location": {"type": "Point", "coordinates": [72.8550, 19.0650]},
        "skills": ["nurse", "first_aid"],
        "status": "available",
    },
    {
        "name": "Priya Nair",
        "email": "priya.n@example.com",
        "location": {"type": "Point", "coordinates": [72.8680, 19.0900]},
        "skills": ["driver", "search_and_rescue"],
        "status": "busy",
    },
    {
        "name": "Vikram Rao",
        "email": "vikram.r@example.com",
        "location": {"type": "Point", "coordinates": [72.8750, 19.1250]},
        "skills": ["ham_radio", "logistics"],
        "status": "available",
    },
    {
        "name": "Sneha Kulkarni",
        "email": "sneha.k@example.com",
        "location": {"type": "Point", "coordinates": [72.8900, 19.1500]},
        "skills": ["first_aid", "counseling"],
        "status": "offline",
    },
    {
        "name": "Karan Joshi",
        "email": "karan.j@example.com",
        "location": {"type": "Point", "coordinates": [72.9050, 19.1800]},
        "skills": ["drone_operator", "navigation"],
        "status": "available",
    },
    {
        "name": "Neha Verma",
        "email": "neha.v@example.com",
        "location": {"type": "Point", "coordinates": [72.9200, 19.2100]},
        "skills": ["translator", "triage"],
        "status": "available",
    },
]

DUMMY_EMERGENCY_REQUESTS = [
    {
        "description": "Building Structural Collapse — Victims trapped under debris",
        "location": {"type": "Point", "coordinates": [72.8360, 18.9600]},
        "severity": "critical",
        "category": "trapped",
        "status": "pending",
        "reporter_name": "Sunil Patil",
        "reporter_email": "sunil@example.com",
        "created_at": datetime.utcnow(),
    },
    {
        "description": "Commercial Complex Electrical Fire",
        "location": {"type": "Point", "coordinates": [72.8480, 19.0400]},
        "severity": "high",
        "category": "fire",
        "status": "pending",
        "reporter_name": "Rajesh Iyer",
        "reporter_email": "rajesh@example.com",
        "created_at": datetime.utcnow(),
    },
    {
        "description": "Urban Monsoon Flooding & Waterlogging",
        "location": {"type": "Point", "coordinates": [72.8620, 19.0800]},
        "severity": "medium",
        "category": "flood",
        "status": "pending",
        "reporter_name": "Meena Deshmukh",
        "reporter_email": "meena@example.com",
        "created_at": datetime.utcnow(),
    },
    {
        "description": "Multi-Vehicle Road Collision on Expressway",
        "location": {"type": "Point", "coordinates": [72.8800, 19.1350]},
        "severity": "high",
        "category": "medical",
        "status": "pending",
        "reporter_name": "Deepak Joshi",
        "reporter_email": "deepak@example.com",
        "created_at": datetime.utcnow(),
    },
    {
        "description": "LPG Gas Cylinder Leak in Apartment",
        "location": {"type": "Point", "coordinates": [72.8950, 19.1650]},
        "severity": "low",
        "category": "other",
        "status": "pending",
        "reporter_name": "Kavita Shah",
        "reporter_email": "kavita@example.com",
        "created_at": datetime.utcnow(),
    },
]

async def seed():
    connected = await connect_to_mongo()
    if not connected:
        print("Error: Could not connect to MongoDB to seed data. Check MONGO_URI in .env.")
        return

    db = get_database()

    print("Clearing existing documents...")
    await db.rescue_teams.delete_many({})
    await db.ambulances.delete_many({})
    await db.hospitals.delete_many({})
    await db.volunteers.delete_many({})
    await db.emergency_requests.delete_many({})

    print("Inserting 5 Rescue Teams...")
    await db.rescue_teams.insert_many(DUMMY_RESCUE_TEAMS)

    print("Inserting 5 Ambulances...")
    await db.ambulances.insert_many(DUMMY_AMBULANCES)

    print("Inserting 3 Hospitals...")
    await db.hospitals.insert_many(DUMMY_HOSPITALS)

    print("Inserting 8 Volunteers...")
    await db.volunteers.insert_many(DUMMY_VOLUNTEERS)

    print("Inserting 5 Emergency Requests...")
    await db.emergency_requests.insert_many(DUMMY_EMERGENCY_REQUESTS)

    print("Seed data populated successfully across Mumbai, India coordinates!")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed())
