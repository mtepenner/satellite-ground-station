import asyncio
import json
import logging

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_until_first_complete

from app.api.dependencies import get_redis_pool
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


async def _redis_receiver(websocket: WebSocket) -> None:
    """Subscribe to the Redis telemetry channel and forward each message to
    the connected WebSocket client."""
    redis: aioredis.Redis = get_redis_pool()
    pubsub = redis.pubsub()
    await pubsub.subscribe(settings.redis_telemetry_channel)
    try:
        async for raw in pubsub.listen():
            if raw["type"] != "message":
                continue
            data = raw["data"]
            # Validate it is valid JSON before forwarding
            try:
                json.loads(data)
            except (json.JSONDecodeError, TypeError):
                logger.warning("Received non-JSON telemetry message, skipping")
                continue
            await websocket.send_text(data)
    except asyncio.CancelledError:
        pass
    finally:
        await pubsub.unsubscribe(settings.redis_telemetry_channel)
        await pubsub.aclose()


async def _ws_receiver(websocket: WebSocket) -> None:
    """Drain incoming WebSocket frames so the connection stays healthy."""
    async for _ in websocket.iter_text():
        pass  # clients only receive; ignore any text sent to server


@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket) -> None:
    """Live telemetry stream.  Accepts a WebSocket upgrade and pushes every
    telemetry JSON message published to the Redis channel."""
    await websocket.accept()
    logger.info("WebSocket client connected: %s", websocket.client)
    try:
        await run_until_first_complete(
            (_redis_receiver, {"websocket": websocket}),
            (_ws_receiver, {"websocket": websocket}),
        )
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected: %s", websocket.client)
    except Exception as exc:  # noqa: BLE001
        logger.error("WebSocket error: %s", exc)
    finally:
        logger.info("WebSocket session closed: %s", websocket.client)
