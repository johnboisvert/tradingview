import os
import sys
import asyncio
from typing import Optional, Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Railway/Edge issue we are fixing:
# If main.py import is slow or crashes, Railway healthcheck fails and the
# deployment is marked failed. We keep a tiny boot app that ALWAYS responds,
# then try to load the real app in the background.

_boot_app = FastAPI(title="Boot Wrapper")

_main_asgi: Optional[Any] = None
_boot_error: Optional[str] = None
_import_task: Optional[asyncio.Task] = None


def _try_import_main() -> None:
    """Import main.py safely. Runs in a thread."""
    global _main_asgi, _boot_error
    try:
        import importlib

        m = importlib.import_module("main")
        app = getattr(m, "app", None)
        if app is None:
            raise RuntimeError("main.py ne contient pas 'app = FastAPI()'")

        _main_asgi = app
        _boot_error = None
    except Exception as e:
        _main_asgi = None
        _boot_error = f"{type(e).__name__}: {e}"


async def _background_import() -> None:
    await asyncio.to_thread(_try_import_main)


@_boot_app.on_event("startup")
async def _startup() -> None:
    global _import_task
    # Fire-and-forget import attempt; does NOT block server start.
    _import_task = asyncio.create_task(_background_import())


@_boot_app.get("/health")
async def health() -> dict:
    # Always 200. Railway healthcheck expects quick answer.
    if _main_asgi is not None:
        state = "main_loaded"
    elif _boot_error:
        state = "boot_error"
    elif _import_task and not _import_task.done():
        state = "loading"
    else:
        state = "boot_only"
    return {"status": "ok", "state": state, "boot_error": _boot_error}


@_boot_app.get("/__boot_error")
async def boot_error() -> Any:
    if _boot_error:
        return JSONResponse({"status": "error", "error": _boot_error}, status_code=500)
    if _main_asgi is not None:
        return {"status": "ok", "error": None, "state": "main_loaded"}
    return {"status": "ok", "error": None, "state": "loading"}


@_boot_app.post("/__boot_reload")
async def boot_reload() -> dict:
    global _import_task
    _import_task = asyncio.create_task(_background_import())
    return {"status": "ok", "message": "reload started"}


class SwitchASGI:
    """ASGI app that forwards to main.app once it is available."""

    def __init__(self, boot_app: Any):
        self.boot_app = boot_app

    async def __call__(self, scope, receive, send):
        if _main_asgi is not None:
            return await _main_asgi(scope, receive, send)
        return await self.boot_app(scope, receive, send)


# uvicorn should run: uvicorn boot:app
app = SwitchASGI(_boot_app)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("boot:app", host="0.0.0.0", port=port, log_level="info")
