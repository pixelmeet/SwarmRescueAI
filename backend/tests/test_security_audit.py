import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_database
from app.seed.seed_data import seed

@pytest.fixture(autouse=True)
async def setup_db():
    await connect_to_mongo()
    await seed()
    yield
    await close_mongo_connection()

@pytest.mark.asyncio
async def test_public_get_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        for path in ["/api/teams", "/api/ambulances", "/api/hospitals", "/api/volunteers", "/api/requests"]:
            res = await ac.get(path)
            assert res.status_code == 200, f"GET {path} failed: {res.status_code}"

@pytest.mark.asyncio
async def test_public_report_form():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/requests", json={
            "description": "Test public report form emergency",
            "location": {"type": "Point", "coordinates": [72.83, 18.93]},
            "reporter_name": "Test Citizen",
            "reporter_email": "citizen@example.com"
        })
        assert res.status_code == 201, f"Public POST /api/requests failed: {res.status_code}"

@pytest.mark.asyncio
async def test_unauthenticated_writes_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Fetch one item from GET endpoints to test PATCH & DELETE
        team_res = await ac.get("/api/teams")
        team_id = team_res.json()[0]["id"]
        
        req_res = await ac.get("/api/requests")
        req_id = req_res.json()[0]["id"]

        # POST without auth -> 401
        res = await ac.post("/api/teams", json={
            "name": "Test Team",
            "location": {"type": "Point", "coordinates": [72.83, 18.93]}
        })
        assert res.status_code == 401

        # PATCH without auth -> 401
        res = await ac.patch(f"/api/teams/{team_id}", json={"name": "Hacked Name"})
        assert res.status_code == 401

        # DELETE without auth -> 401
        res = await ac.delete(f"/api/teams/{team_id}")
        assert res.status_code == 401

        # PATCH request without auth -> 401
        res = await ac.patch(f"/api/requests/{req_id}", json={"description": "Hacked"})
        assert res.status_code == 401

        # DELETE request without auth -> 401
        res = await ac.delete(f"/api/requests/{req_id}")
        assert res.status_code == 401

@pytest.mark.asyncio
async def test_admin_authenticated_writes_succeed():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login
        login_res = await ac.post("/api/auth/login", json={"username": "admin", "password": "password"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create team with admin token
        res = await ac.post("/api/teams", json={
            "name": "Admin Created Team",
            "location": {"type": "Point", "coordinates": [72.83, 18.93]}
        }, headers=headers)
        assert res.status_code == 201
        created_team = res.json()
        assert "access_code" in created_team
        assert len(created_team["access_code"]) == 6

        # Update team with admin token
        res = await ac.patch(f"/api/teams/{created_team['id']}", json={"name": "Updated Team Name"}, headers=headers)
        assert res.status_code == 200

        # Delete team with admin token
        res = await ac.delete(f"/api/teams/{created_team['id']}", headers=headers)
        assert res.status_code == 200

@pytest.mark.asyncio
async def test_assignment_status_access_code_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login admin to create an assignment
        login_res = await ac.post("/api/auth/login", json={"username": "admin", "password": "password"})
        token = login_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {token}"}

        team_res = await ac.get("/api/teams")
        teams = team_res.json()
        target_team = teams[0]

        req_res = await ac.get("/api/requests")
        target_req = req_res.json()[0]

        # Create assignment
        assign_res = await ac.post("/api/assignments", json={
            "request_id": target_req["id"],
            "resource_type": "rescue_team",
            "resource_id": target_team["id"],
            "eta_minutes": 15
        }, headers=admin_headers)
        assert assign_res.status_code == 201
        assignment_id = assign_res.json()["id"]

        # 1. Update status without access_code -> 401
        res = await ac.patch(f"/api/assignments/{assignment_id}/status", json={
            "status": "en_route"
        })
        assert res.status_code == 401

        # 2. Update status with invalid access_code -> 401
        res = await ac.patch(f"/api/assignments/{assignment_id}/status", json={
            "status": "en_route",
            "resource_id": target_team["id"],
            "access_code": "WRONG1"
        })
        assert res.status_code == 401

        # 3. Update status with mismatched resource_id -> 401
        other_team = teams[1]
        res = await ac.patch(f"/api/assignments/{assignment_id}/status", json={
            "status": "en_route",
            "resource_id": other_team["id"],
            "access_code": other_team["access_code"]
        })
        assert res.status_code == 401

        # 4. Update status with correct resource_id + correct access_code -> 200
        res = await ac.patch(f"/api/assignments/{assignment_id}/status", json={
            "status": "en_route",
            "resource_id": target_team["id"],
            "access_code": target_team["access_code"]
        })
        assert res.status_code == 200
        assert res.json()["status"] == "en_route"
