from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import BadRequest, Conflict, Forbidden, NotFound, UnprocessableEntity
from app.core.security import verify_password
from app.models import Comment, Follow, Interest, Like, Repost, User
from app.repositories import users as users_repo
from app.schemas.common import Page
from app.schemas.user import (
    FollowState,
    ProfileOut,
    ProfileUpdate,
    SettingsUpdate,
    UserCard,
)
from app.services import media_service, notification_service, post_service, presenters
from app.services.storage import get_storage
from app.utils.pagination import PageParams, paginate_scalars


def get_by_username_or_404(db: Session, username: str) -> User:
    user = users_repo.get_by_username(db, username)
    if user is None or not user.is_active:
        raise NotFound("This account doesn't exist", "user_not_found")
    return user


def update_profile(db: Session, user: User, data: ProfileUpdate) -> User:
    profile = user.profile
    profile.display_name = data.display_name
    profile.bio = data.bio
    profile.location = data.location
    profile.website = data.website
    db.commit()
    return user


def update_username(db: Session, user: User, username: str) -> User:
    if username == user.username:
        return user
    if users_repo.username_taken(db, username, exclude_id=user.id):
        raise Conflict("Username is already taken", "username_taken", field="username")
    user.username = username
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise Conflict("Username is already taken", "username_taken", field="username") from None
    return user


def update_email(db: Session, user: User, email: str, current_password: str) -> User:
    if not verify_password(current_password, user.hashed_password):
        raise UnprocessableEntity("Current password is incorrect", "current_password_invalid", field="current_password")
    if email == user.email:
        return user
    if users_repo.email_taken(db, email, exclude_id=user.id):
        raise Conflict("An account with this email already exists", "email_taken", field="email")
    user.email = email
    db.commit()
    return user


def update_interests(db: Session, user: User, interest_ids: list[int]) -> User:
    unique_ids = list(dict.fromkeys(interest_ids))
    interests = list(db.scalars(select(Interest).where(Interest.id.in_(unique_ids)))) if unique_ids else []
    if len(interests) != len(unique_ids):
        raise UnprocessableEntity("Some of the selected interests don't exist", "interest_invalid", field="interest_ids")
    user.interests = sorted(interests, key=lambda interest: interest.position)
    db.commit()
    return user


def update_settings(db: Session, user: User, data: SettingsUpdate) -> User:
    settings = users_repo.get_settings(db, user)
    for field, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(settings, field, value)
    db.commit()
    return user


def complete_onboarding(db: Session, user: User) -> User:
    user.onboarding_completed = True
    db.commit()
    return user


def set_avatar(db: Session, user: User, raw: bytes) -> User:
    media = media_service.store_image(db, user, raw, "avatar")
    previous_id = user.profile.avatar_media_id
    user.profile.avatar_media_id = media.id
    user.profile.avatar = media
    db.flush()
    media_service.delete_if_orphaned(db, previous_id)
    db.commit()
    return user


def remove_avatar(db: Session, user: User) -> User:
    previous_id = user.profile.avatar_media_id
    user.profile.avatar_media_id = None
    user.profile.avatar = None
    db.flush()
    media_service.delete_if_orphaned(db, previous_id)
    db.commit()
    return user


def delete_account(db: Session, user: User, password: str) -> None:
    if not verify_password(password, user.hashed_password):
        raise UnprocessableEntity("Password is incorrect", "current_password_invalid", field="password")
    keys = media_service.storage_keys_for_user(db, user.id)
    # Counters on other people's posts include this account's likes, reposts and comments.
    affected = (
        set(db.scalars(select(Like.post_id).where(Like.user_id == user.id)))
        | set(db.scalars(select(Repost.post_id).where(Repost.user_id == user.id)))
        | set(db.scalars(select(Comment.post_id).where(Comment.author_id == user.id)))
    )
    db.delete(user)
    db.flush()
    post_service.recount(db, list(affected))
    db.commit()
    storage = get_storage()
    for key in keys:
        storage.delete(key)


def follow(db: Session, viewer: User, target_id: int) -> FollowState:
    if viewer.id == target_id:
        raise BadRequest("You can't follow yourself", "cannot_follow_self")
    target = users_repo.get_by_id(db, target_id)
    if target is None or not target.is_active:
        raise NotFound("This account doesn't exist", "user_not_found")
    exists = db.get(Follow, (viewer.id, target_id))
    if exists is None:
        db.add(Follow(follower_id=viewer.id, followee_id=target_id))
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
        else:
            notification_service.notify(db, recipient_id=target_id, actor_id=viewer.id, kind="follow")
        db.commit()
    return FollowState(
        user_id=target_id, following=True, followers_count=users_repo.follower_counts(db, [target_id]).get(target_id, 0)
    )


def unfollow(db: Session, viewer: User, target_id: int) -> FollowState:
    target = users_repo.get_by_id(db, target_id)
    if target is None:
        raise NotFound("This account doesn't exist", "user_not_found")
    db.execute(delete(Follow).where(Follow.follower_id == viewer.id, Follow.followee_id == target_id))
    notification_service.withdraw(db, recipient_id=target_id, actor_id=viewer.id, kind="follow")
    db.commit()
    return FollowState(
        user_id=target_id,
        following=False,
        followers_count=users_repo.follower_counts(db, [target_id]).get(target_id, 0),
    )


def public_profile(db: Session, username: str, viewer: User | None) -> ProfileOut:
    return presenters.profile_out(db, get_by_username_or_404(db, username), viewer)


def _follow_list(db: Session, user: User, viewer: User | None, params: PageParams, stmt) -> Page[UserCard]:
    settings = users_repo.get_settings(db, user)
    if not settings.show_follow_lists and (viewer is None or viewer.id != user.id):
        raise Forbidden("This account keeps its connections private", "follow_lists_private")
    items, total = paginate_scalars(db, stmt, params)
    cards = presenters.user_cards(db, items, viewer.id if viewer else None)
    return Page.build(cards, params.page, params.limit, total)


def followers(db: Session, username: str, viewer: User | None, params: PageParams) -> Page[UserCard]:
    user = get_by_username_or_404(db, username)
    return _follow_list(db, user, viewer, params, users_repo.followers_stmt(user.id))


def following(db: Session, username: str, viewer: User | None, params: PageParams) -> Page[UserCard]:
    user = get_by_username_or_404(db, username)
    return _follow_list(db, user, viewer, params, users_repo.following_stmt(user.id))


def recommended(db: Session, viewer: User | None, limit: int) -> list[UserCard]:
    interest_ids = [interest.id for interest in viewer.interests] if viewer else []
    stmt = users_repo.recommended_stmt(viewer.id if viewer else None, interest_ids, limit)
    users = list(db.scalars(stmt).unique())
    return presenters.user_cards(db, users, viewer.id if viewer else None)
