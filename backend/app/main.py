import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import ensure_indexes
from app.routers import (
    requests,
    teams,
    ambulances,
    hospitals,
    volunteers,
    assignments,
    auth,
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

# Include API routers under /api and /api/v1
app.include_router(requests.router, prefix="/api/requests", tags=["Requests"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(ambulances.router, prefix="/api/ambulances", tags=["Ambulances"])
app.include_router(hospitals.router, prefix="/api/hospitals", tags=["Hospitals"])
app.include_router(volunteers.router, prefix="/api/volunteers", tags=["Volunteers"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])

app.include_router(requests.router, prefix="/api/v1/requests", tags=["Requests (v1)"])
app.include_router(teams.router, prefix="/api/v1/teams", tags=["Teams (v1)"])
app.include_router(ambulances.router, prefix="/api/v1/ambulances", tags=["Ambulances (v1)"])
app.include_router(hospitals.router, prefix="/api/v1/hospitals", tags=["Hospitals (v1)"])
app.include_router(volunteers.router, prefix="/api/v1/volunteers", tags=["Volunteers (v1)"])
app.include_router(assignments.router, prefix="/api/v1/assignments", tags=["Assignments"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

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
