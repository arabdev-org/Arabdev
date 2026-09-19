from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile, status

from app.api.v1.auth import token_response
from app.core.deps import CurrentUser, DbSession, OptionalUser
from app.core.rate_limit import rate_limit
from app.schemas.auth import TokenOut
from app.schemas.comment import ReplyOut
from app.schemas.common import Page
from app.schemas.post import PostOut
from app.schemas.user import (
    AccountDelete,
    EmailUpdate,
    FollowState,
    InterestsUpdate,
    MeOut,
    PasswordUpdate,
    ProfileOut,
    ProfileUpdate,
    SettingsOut,
    SettingsUpdate,
    UserCard,
    UsernameUpdate,
)
from app.services import auth_service, comment_service, media_service, post_service, presenters, user_service
from app.utils.pagination import PageParams, page_params

router = APIRouter(prefix="/users", tags=["Users"])
Pagination = Annotated[PageParams, Depends(page_params)]


# ------------------------------------------------------------ the signed-in user


@router.get("/me", response_model=MeOut, summary="The signed-in account")
def me(db: DbSession, user: CurrentUser) -> MeOut:
    return presenters.me_out(db, user)


@router.patch("/me/profile", response_model=MeOut, summary="Update display name, bio, location and website")
def update_profile(data: ProfileUpdate, db: DbSession, user: CurrentUser) -> MeOut:
    return presenters.me_out(db, user_service.update_profile(db, user, data))


@router.patch("/me/username", response_model=MeOut, summary="Change username")
def update_username(data: UsernameUpdate, db: DbSession, user: CurrentUser) -> MeOut:
    return presenters.me_out(db, user_service.update_username(db, user, data.username))


@router.patch("/me/email", response_model=MeOut, summary="Change email (requires current password)")
def update_email(data: EmailUpdate, db: DbSession, user: CurrentUser) -> MeOut:
    return presenters.me_out(db, user_service.update_email(db, user, data.email, data.current_password))


@router.put(
    "/me/password",
    response_model=TokenOut,
    summary="Change password; signs out other sessions and returns fresh tokens",
    dependencies=[Depends(rate_limit("password_change", limit=10, window=900))],
)
def change_password(
    data: PasswordUpdate, db: DbSession, user: CurrentUser, request: Request, response: Response
) -> TokenOut:
    auth_service.change_password(db, user, data.current_password, data.new_password)
    issued = auth_service.issue_tokens(db, user, remember=True, user_agent=request.headers.get("user-agent"))
    return token_response(db, response, issued)


@router.put("/me/interests", response_model=MeOut, summary="Replace the interests list")
def update_interests(data: InterestsUpdate, db: DbSession, user: CurrentUser) -> MeOut:
    return presenters.me_out(db, user_service.update_interests(db, user, data.interest_ids))


@router.get("/me/settings", response_model=SettingsOut, summary="Appearance, privacy and notification settings")
def get_settings(db: DbSession, user: CurrentUser) -> SettingsOut:
    return presenters.me_out(db, user).settings


@router.patch("/me/settings", response_model=SettingsOut, summary="Update settings (partial)")
def update_settings(data: SettingsUpdate, db: DbSession, user: CurrentUser) -> SettingsOut:
    return presenters.me_out(db, user_service.update_settings(db, user, data)).settings


@router.post("/me/onboarding/complete", response_model=MeOut, summary="Mark first-run onboarding as done")
def complete_onboarding(db: DbSession, user: CurrentUser) -> MeOut:
    return presenters.me_out(db, user_service.complete_onboarding(db, user))


@router.post(
    "/me/avatar",
    response_model=MeOut,
    summary="Upload a profile picture (JPEG/PNG/WebP/GIF, max 5 MB)",
    dependencies=[Depends(rate_limit("upload", limit=30, window=600))],
)
async def upload_avatar(db: DbSession, user: CurrentUser, file: UploadFile = File(...)) -> MeOut:
    raw = await media_service.read_upload(file)
    return presenters.me_out(db, user_service.set_avatar(db, user, raw))


@router.delete("/me/avatar", response_model=MeOut, summary="Remove the profile picture")
def remove_avatar(db: DbSession, user: CurrentUser) -> MeOut:
    return presenters.me_out(db, user_service.remove_avatar(db, user))


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT, summary="Permanently delete the account")
def delete_account(data: AccountDelete, db: DbSession, user: CurrentUser) -> Response:
    user_service.delete_account(db, user, data.password)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me/bookmarks", response_model=Page[PostOut], tags=["Interactions"], summary="Saved posts")
def my_bookmarks(db: DbSession, user: CurrentUser, params: Pagination) -> Page[PostOut]:
    return post_service.bookmarks(db, user, params)


# ------------------------------------------------------------ discovery


@router.get("/recommended", response_model=list[UserCard], summary="Developers to follow, based on interests")
def recommended(
    db: DbSession, viewer: OptionalUser, limit: Annotated[int, Query(ge=1, le=30)] = 6
) -> list[UserCard]:
    return user_service.recommended(db, viewer, limit)


# ------------------------------------------------------------ public profiles


@router.get("/{username}", response_model=ProfileOut, summary="Public profile")
def profile(username: str, db: DbSession, viewer: OptionalUser) -> ProfileOut:
    return user_service.public_profile(db, username, viewer)


@router.get("/{username}/posts", response_model=Page[PostOut], summary="Posts and reposts by a user")
def user_posts(username: str, db: DbSession, viewer: OptionalUser, params: Pagination) -> Page[PostOut]:
    return post_service.user_activity(db, username, viewer, params)


@router.get("/{username}/replies", response_model=Page[ReplyOut], summary="Comments written by a user")
def user_replies(username: str, db: DbSession, viewer: OptionalUser, params: Pagination) -> Page[ReplyOut]:
    return comment_service.list_replies_by_user(db, username, viewer, params)


@router.get("/{username}/followers", response_model=Page[UserCard], summary="Followers")
def followers(username: str, db: DbSession, viewer: OptionalUser, params: Pagination) -> Page[UserCard]:
    return user_service.followers(db, username, viewer, params)


@router.get("/{username}/following", response_model=Page[UserCard], summary="Accounts this user follows")
def following(username: str, db: DbSession, viewer: OptionalUser, params: Pagination) -> Page[UserCard]:
    return user_service.following(db, username, viewer, params)


@router.post(
    "/{user_id}/follow",
    response_model=FollowState,
    summary="Follow a user",
    dependencies=[Depends(rate_limit("follow", limit=120, window=3600))],
)
def follow(user_id: int, db: DbSession, user: CurrentUser) -> FollowState:
    return user_service.follow(db, user, user_id)


@router.delete("/{user_id}/follow", response_model=FollowState, summary="Unfollow a user")
def unfollow(user_id: int, db: DbSession, user: CurrentUser) -> FollowState:
    return user_service.unfollow(db, user, user_id)
