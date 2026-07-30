import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import ensure_indexes
from app.services.ws_manager import ws_manager
from app.routers import (
    requests,
    teams,
    ambulances,
    hospitals,
    volunteers,
    assignments,
    auth,
    analytics,
)

logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup lifecycle
    try:
        connected = await connect_to_mongo()
        if not connected:
            logger.warning("MongoDB unavailable — API will start but database operations will fail until MONGO_URI is corrected")
        else:
            db = get_database()
            await ensure_indexes(db)
    except Exception as e:
        logger.warning("MongoDB unavailable — API will start but database operations will fail until MONGO_URI is corrected")
    yield
    # Shutdown lifecycle
    await close_mongo_connection()

app = FastAPI(
    title="SwarmRescue AI Backend",
    description="Multi-Agent Emergency Triage and Response System API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api prefix
app.include_router(requests.router, prefix="/api/requests", tags=["Requests"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(ambulances.router, prefix="/api/ambulances", tags=["Ambulances"])
app.include_router(hospitals.router, prefix="/api/hospitals", tags=["Hospitals"])
app.include_router(volunteers.router, prefix="/api/volunteers", tags=["Volunteers"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


from pydantic import BaseModel
from app.services.severity_classifier import classify_emergency

class StandaloneClassifyTestInput(BaseModel):
    description: str

@app.post("/api/classify-test", tags=["Classification"])
async def classify_test_direct(payload: StandaloneClassifyTestInput):
    return await classify_emergency(payload.description)

@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "SwarmRescue AI Backend API",
        "version": "0.1.0",
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

