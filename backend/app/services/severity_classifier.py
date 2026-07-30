import os
import json
import re
import logging
from typing import List, Dict, Any
import httpx
from pydantic import BaseModel, Field, ValidationError

from app.config import settings
from app.schemas.request import SeverityEnum, CategoryEnum

logger = logging.getLogger("uvicorn")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = "llama-3.3-70b-versatile"

FALLBACK_CLASSIFICATION: Dict[str, Any] = {
    "severity": "medium",
    "category": "other",
    "required_skills": [],
    "reasoning": "auto-classification failed, defaulted"
}

SYSTEM_PROMPT = """You are an emergency triage AI assistant. Analyze the given emergency description and classify it.
You MUST respond with ONLY valid JSON, without any markdown formatting, without markdown code block fences (no ``` or ```json), and with no text before or after the JSON.

The JSON output MUST follow this exact schema:
{
  "severity": "low|medium|high|critical",
  "category": "fire|medical|trapped|flood|other",
  "required_skills": ["skill1", "skill2"],
  "reasoning": "one sentence explaining the classification decision"
}
"""

STRICT_SYSTEM_PROMPT = SYSTEM_PROMPT + "\n\nCRITICAL WARNING: Your previous response was invalid. Respond ONLY with raw unformatted JSON text. DO NOT use markdown code blocks or triple backticks."

class SeverityClassification(BaseModel):
    severity: SeverityEnum
    category: CategoryEnum
    required_skills: List[str] = Field(default_factory=list)
    reasoning: str = ""

def clean_json_string(text: str) -> str:
    """Strips markdown code fences and surrounding whitespace from JSON response."""
    text = text.strip()
    # Remove markdown block backticks if present
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()

def validate_and_format_classification(raw_text: str) -> dict:
    cleaned = clean_json_string(raw_text)
    parsed_json = json.loads(cleaned)
    validated = SeverityClassification(**parsed_json)
    return {
        "severity": validated.severity.value,
        "category": validated.category.value,
        "required_skills": validated.required_skills,
        "reasoning": validated.reasoning
    }

async def classify_emergency(description: str) -> dict:
    """
    Classifies an emergency description using Groq's LLM API.
    Retries once with a stricter prompt on failure, and falls back to a default dict if both fail.
    """
    api_key = getattr(settings, "GROQ_API_KEY", None) or os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "placeholder_groq_key":
        logger.warning("GROQ_API_KEY is missing or placeholder. Using fallback classification.")
        return dict(FALLBACK_CLASSIFICATION)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    attempts = [SYSTEM_PROMPT, STRICT_SYSTEM_PROMPT]

    async with httpx.AsyncClient(timeout=10.0) as client:
        for attempt_idx, prompt in enumerate(attempts):
            payload = {
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": description}
                ],
                "temperature": 0.1
            }

            try:
                response = await client.post(GROQ_URL, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    result = validate_and_format_classification(content)
                    return result
                else:
                    logger.warning(
                        f"Groq API call attempt {attempt_idx + 1} returned status code {response.status_code}: {response.text}"
                    )
            except (httpx.HTTPError, json.JSONDecodeError, ValidationError, KeyError, Exception) as err:
                logger.warning(f"Groq API classification attempt {attempt_idx + 1} failed: {err}")

    logger.error("All classification attempts failed. Returning fallback classification.")
    return dict(FALLBACK_CLASSIFICATION)
