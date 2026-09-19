from collections.abc import Iterable
from datetime import datetime

from sqlalchemy import Select, case, exists, func, or_, select, union_all
from sqlalchemy.orm import Session

from app.models import Bookmark, Follow, Like, Post, Repost, Tag, post_tags, user_interests
from app.utils.pagination import PageParams
from app.utils.text import escape_like


def get(db: Session, post_id: int) -> Post | None:
    return db.get(Post, post_id)


def get_many(db: Session, ids: Iterable[int]) -> dict[int, Post]:
    ids = list(set(ids))
    if not ids:
        return {}
    return {post.id: post for post in db.scalars(select(Post).where(Post.id.in_(ids))).unique()}


def latest_stmt() -> Select:
    return select(Post).order_by(Post.created_at.desc(), Post.id.desc())


def for_you_stmt(viewer_id: int) -> Select:
    """Newest days first; within a day, posts from people you follow and on your interests rank higher."""
    followed = select(Follow.followee_id).where(Follow.follower_id == viewer_id)
    my_interests = select(user_interests.c.interest_id).where(user_interests.c.user_id == viewer_id)
    on_my_interests = (
        exists()
        .where(post_tags.c.post_id == Post.id)
        .where(post_tags.c.tag_id == Tag.id)
        .where(Tag.interest_id.in_(my_interests))
    )
    relevance = case((Post.author_id.in_(followed), 2), else_=0) + case((on_my_interests, 1), else_=0)
    return select(Post).order_by(
        func.date(Post.created_at).desc(), relevance.desc(), Post.created_at.desc(), Post.id.desc()
    )


def trending_stmt(since: datetime | None) -> Select:
    score = Post.likes_count + Post.comments_count * 2 + Post.reposts_count * 2
    stmt = select(Post).order_by(score.desc(), Post.created_at.desc(), Post.id.desc())
    if since is not None:
        stmt = stmt.where(Post.created_at >= since)
    return stmt


def tag_stmt(slug: str) -> Select:
    return (
        select(Post)
        .join(post_tags, post_tags.c.post_id == Post.id)
        .join(Tag, Tag.id == post_tags.c.tag_id)
        .where(Tag.slug == slug)
        .order_by(Post.created_at.desc(), Post.id.desc())
    )


def bookmarks_stmt(user_id: int) -> Select:
    return (
        select(Post)
        .join(Bookmark, Bookmark.post_id == Post.id)
        .where(Bookmark.user_id == user_id)
        .order_by(Bookmark.created_at.desc())
    )


def search_stmt(query: str) -> Select:
    pattern = f"%{escape_like(query)}%"
    return (
        select(Post)
        .where(or_(Post.title.ilike(pattern, escape="\\"), Post.content_text.ilike(pattern, escape="\\")))
        .order_by(Post.created_at.desc(), Post.id.desc())
    )


def activity_page(
    db: Session, actor_filter_posts, actor_filter_reposts, params: PageParams
) -> tuple[list[tuple[int, datetime]], int]:
    """A page of (post_id, activity_at) combining posts written and reposted by a set of users.

    A post that was both written and reposted (or reposted by several people) appears once,
    at the time of its most recent activity.
    """
    written = select(Post.id.label("post_id"), Post.created_at.label("activity_at")).where(actor_filter_posts)
    reposted = select(Repost.post_id.label("post_id"), Repost.created_at.label("activity_at")).where(
        actor_filter_reposts
    )
    activity = union_all(written, reposted).subquery("activity")
    grouped = (
        select(activity.c.post_id, func.max(activity.c.activity_at).label("activity_at"))
        .group_by(activity.c.post_id)
        .subquery("grouped")
    )
    total = db.scalar(select(func.count()).select_from(grouped)) or 0
    if total == 0:
        return [], 0
    rows = db.execute(
        select(grouped.c.post_id, grouped.c.activity_at)
        .order_by(grouped.c.activity_at.desc(), grouped.c.post_id.desc())
        .limit(params.limit)
        .offset(params.offset)
    ).all()
    return [(row[0], row[1]) for row in rows], total


def latest_reposters(db: Session, post_ids: Iterable[int], actor_filter) -> dict[int, int]:
    """For each post, the most recent reposter among the given actors."""
    post_ids = list(set(post_ids))
    if not post_ids:
        return {}
    rows = db.execute(
        select(Repost.post_id, Repost.user_id)
        .where(Repost.post_id.in_(post_ids), actor_filter)
        .order_by(Repost.created_at.desc())
    ).all()
    result: dict[int, int] = {}
    for post_id, user_id in rows:
        result.setdefault(post_id, user_id)
    return result


def viewer_state(db: Session, viewer_id: int | None, post_ids: Iterable[int]) -> tuple[set[int], set[int], set[int]]:
    post_ids = list(set(post_ids))
    if viewer_id is None or not post_ids:
        return set(), set(), set()

    def ids_for(model) -> set[int]:
        return set(db.scalars(select(model.post_id).where(model.user_id == viewer_id, model.post_id.in_(post_ids))))

    return ids_for(Like), ids_for(Bookmark), ids_for(Repost)
