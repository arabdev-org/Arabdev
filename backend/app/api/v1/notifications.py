from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.notification import NotificationOut, UnreadCount
from app.services import notification_service
from app.utils.pagination import PageParams, page_params

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=Page[NotificationOut], summary="Your notifications, newest first")
def list_notifications(
    db: DbSession,
    user: CurrentUser,
    params: Annotated[PageParams, Depends(page_params)],
    unread_only: bool = False,
) -> Page[NotificationOut]:
    return notification_service.list_for(db, user, params, unread_only)


@router.get("/unread-count", response_model=UnreadCount, summary="Number of unread notifications")
def unread_count(db: DbSession, user: CurrentUser) -> UnreadCount:
    return UnreadCount(count=notification_service.unread_count(db, user))


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT, summary="Mark everything as read")
def read_all(db: DbSession, user: CurrentUser) -> Response:
    notification_service.mark_all_read(db, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT, summary="Mark one as read")
def read_one(notification_id: int, db: DbSession, user: CurrentUser) -> Response:
    notification_service.mark_read(db, user, notification_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
