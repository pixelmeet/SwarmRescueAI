import httpx
from app.config import settings

async def send_notification(email: str, subject: str, message: str) -> bool:
    """
    Service calling Next.js /api/notify endpoint for Nodemailer email notifications.
    """
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                settings.NEXTJS_NOTIFY_URL,
                json={"email": email, "subject": subject, "message": message},
                headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET},
                timeout=5.0,
            )
            return res.status_code == 200
    except Exception:
        return False
