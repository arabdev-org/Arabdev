import uuid
from dataclasses import dataclass
from datetime import timedelta

from pydantic_core import PydanticCustomError
from sqlalchemy import delete, or_, select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import Conflict, Unauthorized, UnprocessableEntity
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    hash_password,
    hash_token,
    password_needs_rehash,
    verify_password,
)
from app.models import PasswordResetToken, RefreshToken, User
from app.repositories import users as users_repo
from app.schemas.auth import AvailabilityOut, FieldAvailability, RegisterIn
from app.services import email_service
from app.utils.time import utcnow
from app.utils.validators import normalize_username


@dataclass
class IssuedTokens:
    access_token: str
    expires_in: int
    refresh_token: str
    remember: bool
    user: User


def register(db: Session, data: RegisterIn, language: str = "ar") -> User:
    if users_repo.username_taken(db, data.username):
        raise Conflict("Username is already taken", "username_taken", field="username")
    if users_repo.email_taken(db, data.email):
        raise Conflict("An account with this email already exists", "email_taken", field="email")
    user = users_repo.create_user(
        db,
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        language=language,
    )
    db.commit()
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    user = users_repo.get_by_email(db, email)
    if user is None:
        # Hash anyway so response time does not reveal whether the email exists.
        hash_password(password)
        raise Unauthorized("Email or password is incorrect", "invalid_credentials")
    if not verify_password(password, user.hashed_password):
        raise Unauthorized("Email or password is incorrect", "invalid_credentials")
    if not user.is_active:
        raise Unauthorized("This account has been deactivated", "account_inactive")
    if password_needs_rehash(user.hashed_password):
        user.hashed_password = hash_password(password)
    user.last_login_at = utcnow()
    db.commit()
    return user


def _refresh_lifetime(remember: bool) -> timedelta:
    if remember:
        return timedelta(days=settings.refresh_token_expire_days)
    return timedelta(hours=settings.refresh_token_session_hours)


def issue_tokens(
    db: Session, user: User, *, remember: bool, family_id: str | None = None, user_agent: str | None = None
) -> IssuedTokens:
    access_token, expires_in = create_access_token(user.id, user.token_version)
    refresh_token = generate_opaque_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            family_id=family_id or str(uuid.uuid4()),
            remember=remember,
            user_agent=(user_agent or "")[:255] or None,
            expires_at=utcnow() + _refresh_lifetime(remember),
        )
    )
    db.commit()
    return IssuedTokens(access_token, expires_in, refresh_token, remember, user)


def rotate_refresh_token(db: Session, raw_token: str | None, user_agent: str | None = None) -> IssuedTokens:
    if not raw_token:
        raise Unauthorized("Your session has expired. Please sign in again.", "session_expired")
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_token)))
    if stored is None:
        raise Unauthorized("Your session has expired. Please sign in again.", "session_expired")

    now = utcnow()
    grace = timedelta(seconds=settings.refresh_reuse_grace_seconds)
    if stored.revoked_at is not None and stored.rotated_at is not None and now - stored.rotated_at <= grace:
        # Another tab refreshed with the same cookie a moment ago: a race, not theft.
        user = users_repo.get_by_id(db, stored.user_id)
        if user is not None and user.is_active:
            return issue_tokens(db, user, remember=stored.remember, family_id=stored.family_id, user_agent=user_agent)
    if stored.revoked_at is not None:
        # A rotated token was presented again: assume theft and end every session in this family.
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == stored.family_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        db.commit()
        raise Unauthorized("Your session has expired. Please sign in again.", "session_expired")
    if stored.expires_at <= now:
        raise Unauthorized("Your session has expired. Please sign in again.", "session_expired")

    user = users_repo.get_by_id(db, stored.user_id)
    if user is None or not user.is_active:
        raise Unauthorized("Your session has expired. Please sign in again.", "session_expired")

    stored.revoked_at = now
    stored.rotated_at = now
    return issue_tokens(db, user, remember=stored.remember, family_id=stored.family_id, user_agent=user_agent)


def revoke_refresh_token(db: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == hash_token(raw_token), RefreshToken.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )
    db.commit()


def revoke_all_sessions(db: Session, user: User) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )
    user.token_version += 1


def check_availability(
    db: Session, username: str | None, email: str | None, exclude_id: int | None = None
) -> AvailabilityOut:
    result = AvailabilityOut()
    if username is not None:
        try:
            normalized = normalize_username(username)
        except PydanticCustomError as exc:
            result.username = FieldAvailability(available=False, code=exc.type, detail=exc.message())
        else:
            taken = users_repo.username_taken(db, normalized, exclude_id)
            result.username = FieldAvailability(
                available=not taken,
                code="username_taken" if taken else None,
                detail="Username is already taken" if taken else None,
            )
    if email is not None:
        taken = users_repo.email_taken(db, email.strip().lower(), exclude_id)
        result.email = FieldAvailability(
            available=not taken,
            code="email_taken" if taken else None,
            detail="An account with this email already exists" if taken else None,
        )
    return result


def request_password_reset(db: Session, email: str) -> None:
    user = users_repo.get_by_email(db, email)
    if user is None or not user.is_active:
        return  # Same response either way: never reveal which emails have accounts.
    token = generate_opaque_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=utcnow() + timedelta(minutes=settings.password_reset_expire_minutes),
        )
    )
    db.commit()
    email_service.send_password_reset(user.email, token)


def reset_password(db: Session, raw_token: str, new_password: str) -> None:
    stored = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_token(raw_token)))
    now = utcnow()
    if stored is None or stored.used_at is not None or stored.expires_at <= now:
        raise UnprocessableEntity(
            "This reset link is invalid or has expired. Request a new one.", "reset_token_invalid", field="token"
        )
    user = users_repo.get_by_id(db, stored.user_id)
    if user is None:
        raise UnprocessableEntity("This reset link is invalid or has expired.", "reset_token_invalid", field="token")
    user.hashed_password = hash_password(new_password)
    stored.used_at = now
    revoke_all_sessions(db, user)
    db.commit()


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise UnprocessableEntity("Current password is incorrect", "current_password_invalid", field="current_password")
    if verify_password(new_password, user.hashed_password):
        raise UnprocessableEntity(
            "Choose a password different from your current one", "password_unchanged", field="new_password"
        )
    user.hashed_password = hash_password(new_password)
    revoke_all_sessions(db, user)
    db.commit()


# How long ended sign-in records are kept before deletion. Revoked and rotated tokens are
# kept for a week so reuse of a stolen token is still recognised; after that they only
# describe old sessions and have no further use.
ENDED_SESSION_RETENTION = timedelta(days=7)
USED_RESET_RETENTION = timedelta(days=1)


def purge_expired_tokens(db: Session) -> tuple[int, int]:
    """Delete refresh and password-reset records that can no longer be used."""
    now = utcnow()
    session_cutoff = now - ENDED_SESSION_RETENTION
    sessions = db.execute(
        delete(RefreshToken).where(
            or_(RefreshToken.expires_at < session_cutoff, RefreshToken.revoked_at < session_cutoff)
        )
    ).rowcount
    reset_cutoff = now - USED_RESET_RETENTION
    resets = db.execute(
        delete(PasswordResetToken).where(
            or_(PasswordResetToken.expires_at < reset_cutoff, PasswordResetToken.used_at < reset_cutoff)
        )
    ).rowcount
    db.commit()
    return sessions, resets
