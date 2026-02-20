"""
AI Chat proxy router.
Receives Gemini-format contents from the frontend and proxies them
through the backend AIHubService so the API key stays server-side.
"""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from schemas.aihub import GenTxtRequest, ChatMessage
from services.aihub import AIHubService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai-chat"])


class AIChatRequest(BaseModel):
    """Request body matching the frontend's Gemini-format payload."""
    contents: List[Dict[str, Any]]


@router.post("/api/ai-chat")
async def ai_chat(request: AIChatRequest):
    """
    Proxy endpoint for the CryptoIA AI Assistant.
    Converts Gemini-style contents to OpenAI chat messages and calls the AI service.
    """
    try:
        # Convert Gemini-format contents to OpenAI chat messages
        messages: list[ChatMessage] = []
        for item in request.contents:
            role_raw = item.get("role", "user")
            # Gemini uses "model" for assistant
            role = "assistant" if role_raw == "model" else role_raw
            parts = item.get("parts", [])
            text_parts = [p.get("text", "") for p in parts if isinstance(p, dict) and "text" in p]
            content = "\n".join(text_parts)
            if content.strip():
                messages.append(ChatMessage(role=role, content=content))

        if not messages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid messages provided.",
            )

        # Use the existing AI Hub service
        service = AIHubService()
        gen_request = GenTxtRequest(
            messages=messages,
            model="gemini-2.5-pro",
            stream=False,
            temperature=0.7,
            max_tokens=2048,
        )
        response = await service.gentxt(gen_request)

        # Return in Gemini-compatible format so the frontend can parse it
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": response.content}],
                        "role": "model",
                    }
                }
            ],
            "text": response.content,
        }

    except ValueError as e:
        logger.error(f"AI service configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service not configured: {e}",
        )
    except Exception as e:
        logger.error(f"AI chat proxy error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )