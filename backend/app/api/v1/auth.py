from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Query, Request, Response, status

from app.core.config import settings
from app.core.deps import DbSession, require_client_header
from app.core.rate_limit import rate_limit
from app.schemas.auth import AvailabilityOut, ForgotPasswordIn, LoginIn, RegisterIn, ResetPasswordIn, TokenOut
from app.schemas.common import MessageOut
from app.services import auth_service, presenters
from app.services.auth_service import IssuedTokens

router = APIRouter(prefix="/auth", tags=["Authentication"])

RefreshCookie = Annotated[str | None, Cookie(alias=settings.refresh_cookie_name, include_in_schema=False)]


def _cookie_path() -> str:
    return f"{settings.api_v1_prefix}/auth"


def token_response(db, response: Response, issued: IssuedTokens) -> TokenOut:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=issued.refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path=_cookie_path(),
        # Without "remember me" the cookie lives only for the browser session.
        max_age=settings.refresh_token_expire_days * 86400 if issued.remember else None,
    )
    response.headers["Cache-Control"] = "no-store"
    return TokenOut(
        access_token=issued.access_token, expires_in=issued.expires_in, user=presenters.me_out(db, issued.user)
    )


@router.post(
    "/register",
    response_model=TokenOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account and sign in",
    dependencies=[Depends(rate_limit("register", limit=10, window=3600))],
)
def register(data: RegisterIn, db: DbSession, request: Request, response: Response) -> TokenOut:
    user = auth_service.register(db, data, language=data.language)
    issued = auth_service.issue_tokens(db, user, remember=True, user_agent=request.headers.get("user-agent"))
    return token_response(db, response, issued)


@router.post(
    "/login",
    response_model=TokenOut,
    summary="Sign in with email and password",
    dependencies=[Depends(rate_limit("login", limit=10, window=60))],
)
def login(data: LoginIn, db: DbSession, request: Request, response: Response) -> TokenOut:
    user = auth_service.authenticate(db, data.email, data.password)
    issued = auth_service.issue_tokens(
        db, user, remember=data.remember_me, user_agent=request.headers.get("user-agent")
    )
    return token_response(db, response, issued)


@router.post(
    "/refresh",
    response_model=TokenOut,
    summary="Exchange the refresh cookie for a new access token",
    dependencies=[Depends(require_client_header), Depends(rate_limit("refresh", limit=60, window=60))],
)
def refresh(db: DbSession, request: Request, response: Response, refresh_token: RefreshCookie = None) -> TokenOut:
    issued = auth_service.rotate_refresh_token(db, refresh_token, request.headers.get("user-agent"))
    return token_response(db, response, issued)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Sign out of this browser",
    dependencies=[Depends(require_client_header)],
)
def logout(db: DbSession, refresh_token: RefreshCookie = None) -> Response:
    auth_service.revoke_refresh_token(db, refresh_token)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(settings.refresh_cookie_name, path=_cookie_path())
    return response


@router.get(
    "/availability",
    response_model=AvailabilityOut,
    summary="Check whether a username or email can be used",
    dependencies=[Depends(rate_limit("availability", limit=60, window=60))],
)
def availability(
    db: DbSession,
    username: Annotated[str | None, Query(max_length=40)] = None,
    email: Annotated[str | None, Query(max_length=254)] = None,
) -> AvailabilityOut:
    return auth_service.check_availability(db, username, email)


@router.post(
    "/forgot-password",
    response_model=MessageOut,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Email a password reset link",
    dependencies=[Depends(rate_limit("forgot", limit=5, window=900))],
)
def forgot_password(data: ForgotPasswordIn, db: DbSession) -> MessageOut:
    auth_service.request_password_reset(db, data.email)
    return MessageOut(detail="If an account exists for this email, a reset link is on its way.")


@router.post(
    "/reset-password",
    response_model=MessageOut,
    summary="Choose a new password using a reset link",
    dependencies=[Depends(rate_limit("reset", limit=10, window=900))],
)
def reset_password(data: ResetPasswordIn, db: DbSession) -> MessageOut:
    auth_service.reset_password(db, data.token, data.password)
    return MessageOut(detail="Your password has been changed. You can sign in now.")
