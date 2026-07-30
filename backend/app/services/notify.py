import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

async def send_notification(to: str, subject: str, text: str) -> bool:
    """
    Sends email notification by calling the Next.js /api/notify endpoint.
    Payload: { "to": to, "subject": subject, "text": text, "secret": settings.INTERNAL_API_SECRET }
    Returns True if successful, False otherwise.
    Never raises an exception (catches and logs errors).
    """
    if not to:
        logger.warning("send_notification called without recipient email ('to' is empty). Skipping.")
        return False

    url = settings.NEXTJS_NOTIFY_URL
    secret = settings.INTERNAL_API_SECRET

    payload = {
        "to": to,
        "subject": subject,
        "text": text,
        "secret": secret,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                logger.info(f"Email notification sent successfully to {to}")
                return True
            else:
                logger.error(
                    f"Failed to send email notification to {to}. "
                    f"Status Code: {response.status_code}, Response: {response.text}"
                )
                return False
    except Exception as exc:
        logger.error(f"Error calling notify endpoint ({url}) for recipient {to}: {exc}")
        return False
