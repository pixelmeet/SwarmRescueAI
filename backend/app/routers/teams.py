from fastapi import APIRouter
from app.schemas.team import RescueTeamCreate

router = APIRouter()

@router.get("/")
async def list_rescue_teams():
    return {"teams": []}

@router.post("/")
async def create_rescue_team(team: RescueTeamCreate):
    return {"message": "Team registered", "team": team.model_dump()}
