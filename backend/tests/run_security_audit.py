import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_database
from app.seed.seed_data import seed

async def run_audit():
    print("Connecting to Mongo and running seed...")
    await connect_to_mongo()
    db = get_database()
    # Populate seed data without closing connection prematurely
    from app.seed.seed_data import DUMMY_RESCUE_TEAMS, DUMMY_AMBULANCES, DUMMY_HOSPITALS, DUMMY_VOLUNTEERS, DUMMY_EMERGENCY_REQUESTS
    await db.rescue_teams.delete_many({})
    await db.ambulances.delete_many({})
    await db.hospitals.delete_many({})
    await db.volunteers.delete_many({})
    await db.emergency_requests.delete_many({})

    from app.core.deps import generate_access_code
    for item in DUMMY_RESCUE_TEAMS + DUMMY_AMBULANCES + DUMMY_VOLUNTEERS:
        if not item.get("access_code"):
            item["access_code"] = generate_access_code()

    await db.rescue_teams.insert_many(DUMMY_RESCUE_TEAMS)
    await db.ambulances.insert_many(DUMMY_AMBULANCES)
    await db.hospitals.insert_many(DUMMY_HOSPITALS)
    await db.volunteers.insert_many(DUMMY_VOLUNTEERS)
    await db.emergency_requests.insert_many(DUMMY_EMERGENCY_REQUESTS)
    print("Seed complete!\n")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", follow_redirects=True) as ac:
        print("--- 1. Testing GET Endpoints (Public) ---")
        for path in ["/api/teams", "/api/ambulances", "/api/hospitals", "/api/volunteers", "/api/requests"]:
            res = await ac.get(path)
            assert res.status_code == 200, f"GET {path} returned {res.status_code}"
            print(f"  [PASS] GET {path} returned 200 OK")

        print("\n--- 2. Testing Emergency Request Creation Form (Public) ---")
        res = await ac.post("/api/requests", json={
            "description": "Test public report form emergency",
            "location": {"type": "Point", "coordinates": [72.83, 18.93]},
            "reporter_name": "Test Citizen",
            "reporter_email": "citizen@example.com"
        })
        assert res.status_code == 201, f"POST /api/requests returned {res.status_code}"
        print("  [PASS] POST /api/requests returned 201 Created without auth")

        print("\n--- 3. Testing Protection of Unauthenticated Admin Writes ---")
        team_res = await ac.get("/api/teams")
        team_id = team_res.json()[0]["id"]

        req_res = await ac.get("/api/requests")
        req_id = req_res.json()[0]["id"]

        # POST /api/teams -> 401
        res = await ac.post("/api/teams", json={"name": "Hacked Team", "location": {"type": "Point", "coordinates": [72.83, 18.93]}})
        assert res.status_code == 401, f"POST /api/teams returned {res.status_code}"
        print("  [PASS] Unauthenticated POST /api/teams returned 401 Unauthorized")

        # PATCH /api/teams/{id} -> 401
        res = await ac.patch(f"/api/teams/{team_id}", json={"name": "Hacked Name"})
        assert res.status_code == 401
        print(f"  [PASS] Unauthenticated PATCH /api/teams/{team_id} returned 401 Unauthorized")

        # DELETE /api/teams/{id} -> 401
        res = await ac.delete(f"/api/teams/{team_id}")
        assert res.status_code == 401
        print(f"  [PASS] Unauthenticated DELETE /api/teams/{team_id} returned 401 Unauthorized")

        # PATCH /api/requests/{id} -> 401
        res = await ac.patch(f"/api/requests/{req_id}", json={"description": "Hacked"})
        assert res.status_code == 401
        print(f"  [PASS] Unauthenticated PATCH /api/requests/{req_id} returned 401 Unauthorized")

        # DELETE /api/requests/{id} -> 401
        res = await ac.delete(f"/api/requests/{req_id}")
        assert res.status_code == 401
        print(f"  [PASS] Unauthenticated DELETE /api/requests/{req_id} returned 401 Unauthorized")

        print("\n--- 4. Testing Admin Authenticated Writes ---")
        login_res = await ac.post("/api/auth/login", json={"username": "admin", "password": "adminpass"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {token}"}
        print("  [PASS] POST /api/auth/login returned 200 with JWT token")

        # Create team with admin JWT
        res = await ac.post("/api/teams", json={"name": "Admin Created Team", "location": {"type": "Point", "coordinates": [72.83, 18.93]}}, headers=admin_headers)
        assert res.status_code == 201
        created_team = res.json()
        assert "access_code" in created_team and len(created_team["access_code"]) == 6
        print(f"  [PASS] Authenticated POST /api/teams returned 201 (Generated Access Code: {created_team['access_code']})")

        # Update team with admin JWT
        res = await ac.patch(f"/api/teams/{created_team['id']}", json={"name": "Updated Team Name"}, headers=admin_headers)
        assert res.status_code == 200
        print(f"  [PASS] Authenticated PATCH /api/teams/{created_team['id']} returned 200")

        # Delete team with admin JWT
        res = await ac.delete(f"/api/teams/{created_team['id']}", headers=admin_headers)
        assert res.status_code == 200
        print(f"  [PASS] Authenticated DELETE /api/teams/{created_team['id']} returned 200")

        print("\n--- 5. Testing Field Responder Access Code Credentials ---")
        teams_list = (await ac.get("/api/teams")).json()
        target_team = teams_list[0]
        other_team = teams_list[1]
        req = (await ac.get("/api/requests")).json()[0]

        # Admin creates assignment
        assign_res = await ac.post("/api/assignments", json={
            "request_id": req["id"],
            "resource_type": "rescue_team",
            "resource_id": target_team["id"],
            "eta_minutes": 10
        }, headers=admin_headers)
        assert assign_res.status_code == 201
        assignment_id = assign_res.json()["id"]
        print(f"  [PASS] Created assignment {assignment_id} for team {target_team['id']}")

        # 5a. Update assignment status with NO credentials -> 401
        res = await ac.patch(f"/api/assignments/{assignment_id}/status", json={"status": "en_route"})
        assert res.status_code == 401
        print("  [PASS] Status update with no access code / resource_id returned 401 Unauthorized")

        # 5b. Update assignment status with WRONG access code -> 401
        res = await ac.patch(f"/api/assignments/{assignment_id}/status", json={
            "status": "en_route",
            "resource_id": target_team["id"],
            "access_code": "INVALID"
        })
        assert res.status_code == 401
        print("  [PASS] Status update with invalid access code returned 401 Unauthorized")

        # 5c. Update assignment status with MISMATCHED resource_id -> 401
        res = await ac.patch(f"/api/assignments/{assignment_id}/status", json={
            "status": "en_route",
            "resource_id": other_team["id"],
            "access_code": other_team["access_code"]
        })
        assert res.status_code == 401
        print("  [PASS] Status update with mismatched resource_id returned 401 Unauthorized")

        # 5d. Update assignment status with CORRECT matching resource_id + access_code -> 200
        res = await ac.patch(f"/api/assignments/{assignment_id}/status", json={
            "status": "en_route",
            "resource_id": target_team["id"],
            "access_code": target_team["access_code"]
        })
        assert res.status_code == 200
        assert res.json()["status"] == "en_route"
        print(f"  [PASS] Status update with correct resource_id + access_code ({target_team['access_code']}) succeeded with 200 OK!")

    await close_mongo_connection()
    print("\nALL AUTHORIZATION & AUDIT VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_audit())
