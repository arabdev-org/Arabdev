import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.concurrency import run_in_threadpool
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.errors import register_error_handlers
from app.services.auth_service import purge_expired_tokens

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("arabdev")

TOKEN_PURGE_INTERVAL_SECONDS = 6 * 3600

OPENAPI_TAGS = [
    {"name": "Authentication", "description": "Registration, sign in, token refresh and password reset."},
    {"name": "Users", "description": "The signed-in account, public profiles, follows and recommendations."},
    {"name": "Posts", "description": "The feed (server-side paginated, 20 per page) and post CRUD."},
    {"name": "Drafts", "description": "Unpublished posts."},
    {"name": "Comments", "description": "Discussion under posts."},
    {"name": "Interactions", "description": "Likes, bookmarks and reposts."},
    {"name": "Search", "description": "Search across posts, developers and tags."},
    {"name": "Tags", "description": "Post tags and their popularity."},
    {"name": "Interests", "description": "Topics users follow; tags map onto them for recommendations."},
    {"name": "Notifications", "description": "Likes, comments, follows, reposts and mentions."},
    {"name": "Media", "description": "Validated image uploads."},
    {"name": "Ads", "description": "Clearly labelled ads with predictable placement."},
    {"name": "Health", "description": "Service status."},
]


class CachedStaticFiles(StaticFiles):
    """Uploaded files have unique names, so they can be cached forever."""

    def file_response(self, *args, **kwargs):
        response = super().file_response(*args, **kwargs)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


def _purge_tokens_once() -> None:
    with SessionLocal() as db:
        sessions, resets = purge_expired_tokens(db)
    if sessions or resets:
        logger.info("Deleted %d ended sessions and %d old password reset links", sessions, resets)


async def _purge_tokens_periodically() -> None:
    """Ended sign-in sessions and reset links are deleted on a schedule (see the privacy policy)."""
    while True:
        try:
            await run_in_threadpool(_purge_tokens_once)
        except Exception:
            logger.warning("Token clean-up failed", exc_info=True)
        await asyncio.sleep(TOKEN_PURGE_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.media_root.mkdir(parents=True, exist_ok=True)
    purge_task = None if settings.environment == "test" else asyncio.create_task(_purge_tokens_periodically())
    yield
    if purge_task is not None:
        purge_task.cancel()
        with suppress(asyncio.CancelledError):
            await purge_task


def create_app() -> FastAPI:
    app = FastAPI(
        title="ArabDev API",
        version="1.0.0",
        description="REST API for ArabDev, a community for Arabic-speaking developers.",
        openapi_tags=OPENAPI_TAGS,
        contact={"name": "ArabDev support", "url": "https://wiki.arabdev.site/en/#contact", "email": settings.support_email},
        license_info={"name": "GPL-3.0-or-later", "url": "https://www.gnu.org/licenses/gpl-3.0.html"},
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        lifespan=lifespan,
    )
    register_error_handlers(app)

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response

    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-ArabDev-Client", "Accept-Language"],
        expose_headers=["Retry-After"],
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    settings.media_root.mkdir(parents=True, exist_ok=True)
    app.mount(settings.media_url, CachedStaticFiles(directory=settings.media_root), name="media")
    return app


app = create_app()
