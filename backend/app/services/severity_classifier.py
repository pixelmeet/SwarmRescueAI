import httpx
from app.config import settings

async def classify_emergency_severity(description: str) -> dict:
    """
    Placeholder service to classify emergency request severity via Groq LLM API.
    """
    # Logic placeholder
    return {
        "severity": "high",
        "category": "medical_trauma",
        "confidence": 0.95,
        "raw_description": description,
    }
