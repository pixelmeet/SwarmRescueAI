import pytest
from unittest.mock import patch, AsyncMock
from app.services.notify import send_notification

@pytest.mark.asyncio
async def test_send_notification_success():
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.text = '{"sent": true}'

        result = await send_notification("test@example.com", "Test Subject", "Test Body")
        assert result is True
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["json"]["to"] == "test@example.com"
        assert call_kwargs["json"]["subject"] == "Test Subject"
        assert call_kwargs["json"]["text"] == "Test Body"
        assert "secret" in call_kwargs["json"]

@pytest.mark.asyncio
async def test_send_notification_failure_does_not_raise():
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = Exception("Connection refused")

        # Should log exception and return False without raising
        result = await send_notification("test@example.com", "Test Subject", "Test Body")
        assert result is False
