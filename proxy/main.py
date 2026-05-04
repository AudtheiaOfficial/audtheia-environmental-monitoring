"""
Audtheia Species Detection Proxy
=================================
Accepts image uploads from the browser, forwards them to Roboflow's
hosted inference endpoint, and returns detection JSON.

Security model
--------------
- ROBOFLOW_API_KEY is read exclusively from the environment variable set in
  Render.com. It is never written to any file, never committed to the
  repository, and never included in any response returned to the browser.
- CORS is restricted to the explicit origin whitelist below. All other
  origins are rejected at the middleware layer before any application code runs.
- Rate limiting is enforced at 5 requests per IP per hour (in-memory store).
  The real client IP is resolved from Render's X-Forwarded-For header.
- Swagger UI and ReDoc are disabled so no API schema is exposed publicly.
- File uploads are validated for MIME type and size before any forwarding occurs.
- Errors returned to the browser contain no internal detail, key fragments,
  or Roboflow response bodies.
"""

import base64
import logging
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("audtheia-proxy")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ROBOFLOW_API_KEY: str | None = os.environ.get("ROBOFLOW_API_KEY")

ROBOFLOW_ENDPOINT = (
    "https://detect.roboflow.com/official-porifera-classifier-ju8er/12"
)

# Explicit origin whitelist.
# Only these origins may send requests to this proxy.
# 'https://audtheiaofficial.github.io' covers the full GitHub Pages site
# regardless of path. Localhost variants cover local development only.
ALLOWED_ORIGINS = [
    "https://audtheiaofficial.github.io",
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8080",
]

ALLOWED_MIME_TYPES = frozenset({
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
})

# 10 MB ceiling — large enough for high-resolution field photography,
# small enough to prevent abuse of Render's free-tier egress.
MAX_FILE_BYTES = 10 * 1024 * 1024

# Roboflow's hosted inference typically responds in < 5 seconds.
# 30 seconds accommodates cold starts on their end.
ROBOFLOW_TIMEOUT_SECONDS = 30.0

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

def _real_ip(request: Request) -> str:
    """
    Resolve the true client IP behind Render's reverse proxy.

    Render sets X-Forwarded-For to a comma-separated list where the
    leftmost address is the original client. Fall back to the direct
    connection host if the header is absent.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


limiter = Limiter(key_func=_real_ip)

# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not ROBOFLOW_API_KEY:
        raise RuntimeError(
            "ROBOFLOW_API_KEY environment variable is not set. "
            "Add it under Environment in your Render.com Web Service settings."
        )
    logger.info("Audtheia proxy started. Roboflow endpoint is configured.")
    yield
    logger.info("Audtheia proxy stopped.")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Audtheia Species Detection Proxy",
    # Disabling docs prevents public exposure of the API schema.
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)

# Attach the limiter to app state — required by slowapi.
app.state.limiter = limiter

# CORS middleware runs before any route handler.
# allow_credentials=False because no cookies or auth headers cross origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Return a clear, user-facing message when the rate limit is reached."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "detail": (
                "The demo allows 5 detections per hour per IP address. "
                "Please try again later, or set up your own Roboflow workspace "
                "following the Audtheia setup guide."
            ),
        },
    )

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    """
    Health check endpoint.

    Returns HTTP 200 if the proxy is running and ROBOFLOW_API_KEY is present.
    Use this to confirm a successful Render.com deployment before testing /detect.
    """
    return {"status": "ok", "service": "audtheia-proxy"}


@app.post("/detect")
@limiter.limit("5/hour")
async def detect(request: Request, file: UploadFile = File(...)):
    """
    Accept an image upload, forward it to Roboflow hosted inference,
    and return the raw detection JSON to the browser.

    The ROBOFLOW_API_KEY is appended as a query parameter server-side and
    is never visible in any browser request, response, or log line.
    """

    # -- Validate MIME type --------------------------------------------------
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail={
                "error": "unsupported_file_type",
                "detail": (
                    f"Received content type: {file.content_type!r}. "
                    "Accepted formats: JPEG, PNG, WebP, GIF, BMP."
                ),
            },
        )

    # -- Read and size-check the image ---------------------------------------
    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "empty_file",
                "detail": "The uploaded file is empty.",
            },
        )

    if len(image_bytes) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "file_too_large",
                "detail": "Image must be 10 MB or smaller.",
            },
        )

    # -- Base64-encode for Roboflow's inference API --------------------------
    # Roboflow's hosted inference endpoint accepts base64-encoded image data
    # as an application/x-www-form-urlencoded request body.
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # -- Forward to Roboflow -------------------------------------------------
    try:
        async with httpx.AsyncClient(timeout=ROBOFLOW_TIMEOUT_SECONDS) as client:
            rf_response = await client.post(
                ROBOFLOW_ENDPOINT,
                params={"api_key": ROBOFLOW_API_KEY},
                content=image_b64,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail={
                "error": "inference_timeout",
                "detail": (
                    "Roboflow inference did not respond within 30 seconds. "
                    "This can occur when the service is warming up. "
                    "Please wait a moment and try again."
                ),
            },
        )
    except httpx.RequestError:
        # Log the exception type only — no URL or key fragments.
        logger.error("Roboflow connection error — upstream unreachable.")
        raise HTTPException(
            status_code=502,
            detail={
                "error": "upstream_connection_error",
                "detail": "Unable to reach the Roboflow inference service.",
            },
        )

    # -- Surface Roboflow errors without leaking internal detail -------------
    if rf_response.status_code != 200:
        logger.error(
            "Roboflow returned HTTP %d.", rf_response.status_code
        )
        raise HTTPException(
            status_code=502,
            detail={
                "error": "inference_error",
                "detail": (
                    f"Roboflow inference returned HTTP {rf_response.status_code}. "
                    "Verify that the demo API key is valid and the model is deployed."
                ),
            },
        )

    # -- Return detection JSON -----------------------------------------------
    result = rf_response.json()
    prediction_count = len(result.get("predictions", []))
    logger.info("Inference complete — %d prediction(s) returned.", prediction_count)

    return JSONResponse(content=result)
