import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_database

async def run_analytics_tests():
    await connect_to_mongo()
    db = get_database()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("--- 1. Testing Analytics with Fresh Database (No Timing Data) ---")
        # Clean emergency_requests collection
        await db["emergency_requests"].delete_many({})

        # Insert a pending request without assignment/resolution timestamps
        await db["emergency_requests"].insert_one({
            "description": "Test fire incident",
            "location": {"type": "Point", "coordinates": [-122.4194, 37.7749]},
            "severity": "high",
            "category": "fire",
            "status": "pending",
            "reporter_name": "Test User",
            "reporter_email": "test@example.com",
            "created_at": datetime.now(timezone.utc)
        })

        res = await client.get("/api/analytics")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()

        print(f"Response: {data}")
        assert data["avg_time_creation_to_assignment"] is None, "avg_time_creation_to_assignment should be None"
        assert data["avg_time_assignment_to_resolution"] is None, "avg_time_assignment_to_resolution should be None"
        assert data["has_sufficient_data"] is False, "has_sufficient_data should be False"
        print("  [PASS] Fresh database returns null timing averages and has_sufficient_data = False!")

        print("\n--- 2. Testing Analytics with Resolved Request (Real Timing Data) ---")
        now = datetime.now(timezone.utc)
        created_at = now - timedelta(minutes=10)
        assigned_at = now - timedelta(minutes=6)
        resolved_at = now

        await db["emergency_requests"].insert_one({
            "description": "Resolved medical incident",
            "location": {"type": "Point", "coordinates": [-122.4194, 37.7749]},
            "severity": "critical",
            "category": "medical",
            "status": "resolved",
            "reporter_name": "Jane Doe",
            "reporter_email": "jane@example.com",
            "created_at": created_at,
            "assigned_at": assigned_at,
            "resolved_at": resolved_at
        })

        res = await client.get("/api/analytics")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()

        print(f"Response: {data}")
        assert data["avg_time_creation_to_assignment"] == 4.0, f"Expected 4.0, got {data['avg_time_creation_to_assignment']}"
        assert data["avg_time_assignment_to_resolution"] == 6.0, f"Expected 6.0, got {data['avg_time_assignment_to_resolution']}"
        assert data["has_sufficient_data"] is True, "has_sufficient_data should be True"
        print("  [PASS] Resolved request cycle returns real numerical averages (4.0, 6.0) and has_sufficient_data = True!")

        print("\nALL ANALYTICS TESTS PASSED SUCCESSFULLY!")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run_analytics_tests())
