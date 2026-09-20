"""initial schema

Revision ID: c57487890420
Revises: 
Create Date: 2026-09-19 13:45:16.806549
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

import app.models.types

revision: str = 'c57487890420'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('ads',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('sponsor', sa.String(length=80), nullable=False),
    sa.Column('title', sa.String(length=120), nullable=False),
    sa.Column('body', sa.String(length=280), nullable=False),
    sa.Column('cta_label', sa.String(length=40), nullable=False),
    sa.Column('target_url', sa.String(length=500), nullable=False),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('placement', sa.String(length=20), nullable=False),
    sa.Column('language', sa.String(length=5), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('starts_at', app.models.types.UTCDateTime(), nullable=True),
    sa.Column('ends_at', app.models.types.UTCDateTime(), nullable=True),
    sa.Column('impressions', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('clicks', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_ads'))
    )
    with op.batch_alter_table('ads', schema=None) as batch_op:
        batch_op.create_index('ix_ads_is_active_placement', ['is_active', 'placement'], unique=False)

    op.create_table('interests',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('slug', sa.String(length=40), nullable=False),
    sa.Column('name_en', sa.String(length=60), nullable=False),
    sa.Column('name_ar', sa.String(length=60), nullable=False),
    sa.Column('position', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_interests'))
    )
    with op.batch_alter_table('interests', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_interests_slug'), ['slug'], unique=True)

    op.create_table('users',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('username', sa.String(length=30), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('is_admin', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.Column('onboarding_completed', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.Column('token_version', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.Column('updated_at', app.models.types.UTCDateTime(), nullable=False),
    sa.Column('last_login_at', app.models.types.UTCDateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_users'))
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)
        batch_op.create_index(batch_op.f('ix_users_username'), ['username'], unique=True)

    op.create_table('follows',
    sa.Column('follower_id', sa.Integer(), nullable=False),
    sa.Column('followee_id', sa.Integer(), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['followee_id'], ['users.id'], name=op.f('fk_follows_followee_id_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['follower_id'], ['users.id'], name=op.f('fk_follows_follower_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('follower_id', 'followee_id', name=op.f('pk_follows'))
    )
    with op.batch_alter_table('follows', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_follows_followee_id'), ['followee_id'], unique=False)

    op.create_table('media',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('kind', sa.String(length=20), nullable=False),
    sa.Column('storage_key', sa.String(length=255), nullable=False),
    sa.Column('content_type', sa.String(length=50), nullable=False),
    sa.Column('size_bytes', sa.Integer(), nullable=False),
    sa.Column('width', sa.Integer(), nullable=False),
    sa.Column('height', sa.Integer(), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], name=op.f('fk_media_owner_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_media')),
    sa.UniqueConstraint('storage_key', name=op.f('uq_media_storage_key'))
    )
    with op.batch_alter_table('media', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_media_owner_id'), ['owner_id'], unique=False)

    op.create_table('password_reset_tokens',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('expires_at', app.models.types.UTCDateTime(), nullable=False),
    sa.Column('used_at', app.models.types.UTCDateTime(), nullable=True),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_password_reset_tokens_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_password_reset_tokens')),
    sa.UniqueConstraint('token_hash', name=op.f('uq_password_reset_tokens_token_hash'))
    )
    with op.batch_alter_table('password_reset_tokens', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_password_reset_tokens_user_id'), ['user_id'], unique=False)

    op.create_table('refresh_tokens',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('family_id', sa.String(length=36), nullable=False),
    sa.Column('remember', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.Column('user_agent', sa.String(length=255), nullable=True),
    sa.Column('expires_at', app.models.types.UTCDateTime(), nullable=False),
    sa.Column('revoked_at', app.models.types.UTCDateTime(), nullable=True),
    sa.Column('rotated_at', app.models.types.UTCDateTime(), nullable=True),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_refresh_tokens_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_refresh_tokens')),
    sa.UniqueConstraint('token_hash', name=op.f('uq_refresh_tokens_token_hash'))
    )
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_refresh_tokens_family_id'), ['family_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_refresh_tokens_user_id'), ['user_id'], unique=False)

    op.create_table('tags',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('slug', sa.String(length=40), nullable=False),
    sa.Column('name', sa.String(length=40), nullable=False),
    sa.Column('interest_id', sa.Integer(), nullable=True),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['interest_id'], ['interests.id'], name=op.f('fk_tags_interest_id_interests'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_tags'))
    )
    with op.batch_alter_table('tags', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_tags_interest_id'), ['interest_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_tags_slug'), ['slug'], unique=True)

    op.create_table('user_interests',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('interest_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['interest_id'], ['interests.id'], name=op.f('fk_user_interests_interest_id_interests'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_interests_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'interest_id', name=op.f('pk_user_interests'))
    )
    with op.batch_alter_table('user_interests', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_interests_interest_id'), ['interest_id'], unique=False)

    op.create_table('user_settings',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('theme', sa.String(length=10), server_default='system', nullable=False),
    sa.Column('language', sa.String(length=5), server_default='ar', nullable=False),
    sa.Column('discoverable', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('show_follow_lists', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('mentions_from', sa.String(length=12), server_default='everyone', nullable=False),
    sa.Column('notify_likes', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('notify_comments', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('notify_follows', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('notify_reposts', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('notify_mentions', sa.Boolean(), server_default=sa.true(), nullable=False),
    sa.Column('updated_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_settings_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', name=op.f('pk_user_settings'))
    )
    with op.batch_alter_table('user_settings', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_settings_discoverable'), ['discoverable'], unique=False)

    op.create_table('drafts',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=True),
    sa.Column('content_html', sa.Text(), nullable=False),
    sa.Column('link_url', sa.String(length=500), nullable=True),
    sa.Column('image_media_id', sa.Integer(), nullable=True),
    sa.Column('tag_names', sa.JSON(), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.Column('updated_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], name=op.f('fk_drafts_author_id_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['image_media_id'], ['media.id'], name=op.f('fk_drafts_image_media_id_media'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_drafts'))
    )
    with op.batch_alter_table('drafts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_drafts_author_id'), ['author_id'], unique=False)
        batch_op.create_index('ix_drafts_author_id_updated_at', ['author_id', 'updated_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_drafts_image_media_id'), ['image_media_id'], unique=False)

    op.create_table('posts',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=True),
    sa.Column('content_html', sa.Text(), nullable=False),
    sa.Column('content_text', sa.Text(), nullable=False),
    sa.Column('link_url', sa.String(length=500), nullable=True),
    sa.Column('image_media_id', sa.Integer(), nullable=True),
    sa.Column('likes_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('comments_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('reposts_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.Column('updated_at', app.models.types.UTCDateTime(), nullable=False),
    sa.Column('edited_at', app.models.types.UTCDateTime(), nullable=True),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], name=op.f('fk_posts_author_id_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['image_media_id'], ['media.id'], name=op.f('fk_posts_image_media_id_media'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_posts'))
    )
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_posts_author_id'), ['author_id'], unique=False)
        batch_op.create_index('ix_posts_author_id_created_at', ['author_id', 'created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_posts_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_posts_image_media_id'), ['image_media_id'], unique=False)

    op.create_table('profiles',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('display_name', sa.String(length=50), nullable=False),
    sa.Column('bio', sa.String(length=280), nullable=True),
    sa.Column('location', sa.String(length=60), nullable=True),
    sa.Column('website', sa.String(length=200), nullable=True),
    sa.Column('avatar_media_id', sa.Integer(), nullable=True),
    sa.Column('updated_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['avatar_media_id'], ['media.id'], name=op.f('fk_profiles_avatar_media_id_media'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_profiles_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', name=op.f('pk_profiles'))
    )
    with op.batch_alter_table('profiles', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_profiles_avatar_media_id'), ['avatar_media_id'], unique=False)

    op.create_table('bookmarks',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name=op.f('fk_bookmarks_post_id_posts'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_bookmarks_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'post_id', name=op.f('pk_bookmarks'))
    )
    with op.batch_alter_table('bookmarks', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_bookmarks_post_id'), ['post_id'], unique=False)
        batch_op.create_index('ix_bookmarks_user_id_created_at', ['user_id', 'created_at'], unique=False)

    op.create_table('comments',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], name=op.f('fk_comments_author_id_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['parent_id'], ['comments.id'], name=op.f('fk_comments_parent_id_comments'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name=op.f('fk_comments_post_id_posts'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_comments'))
    )
    with op.batch_alter_table('comments', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_comments_author_id'), ['author_id'], unique=False)
        batch_op.create_index('ix_comments_author_id_created_at', ['author_id', 'created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_comments_parent_id'), ['parent_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_comments_post_id'), ['post_id'], unique=False)
        batch_op.create_index('ix_comments_post_id_created_at', ['post_id', 'created_at'], unique=False)

    op.create_table('likes',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name=op.f('fk_likes_post_id_posts'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_likes_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'post_id', name=op.f('pk_likes'))
    )
    with op.batch_alter_table('likes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_likes_post_id'), ['post_id'], unique=False)

    op.create_table('post_tags',
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('tag_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name=op.f('fk_post_tags_post_id_posts'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], name=op.f('fk_post_tags_tag_id_tags'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('post_id', 'tag_id', name=op.f('pk_post_tags'))
    )
    with op.batch_alter_table('post_tags', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_post_tags_tag_id'), ['tag_id'], unique=False)

    op.create_table('reposts',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name=op.f('fk_reposts_post_id_posts'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_reposts_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'post_id', name=op.f('pk_reposts'))
    )
    with op.batch_alter_table('reposts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_reposts_post_id'), ['post_id'], unique=False)
        batch_op.create_index('ix_reposts_user_id_created_at', ['user_id', 'created_at'], unique=False)

    op.create_table('notifications',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('recipient_id', sa.Integer(), nullable=False),
    sa.Column('actor_id', sa.Integer(), nullable=False),
    sa.Column('type', sa.String(length=20), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=True),
    sa.Column('comment_id', sa.Integer(), nullable=True),
    sa.Column('is_read', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.Column('created_at', app.models.types.UTCDateTime(), nullable=False),
    sa.ForeignKeyConstraint(['actor_id'], ['users.id'], name=op.f('fk_notifications_actor_id_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], name=op.f('fk_notifications_comment_id_comments'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name=op.f('fk_notifications_post_id_posts'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], name=op.f('fk_notifications_recipient_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_notifications'))
    )
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_notifications_actor_id'), ['actor_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_notifications_comment_id'), ['comment_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_notifications_post_id'), ['post_id'], unique=False)
        batch_op.create_index('ix_notifications_recipient_id_created_at', ['recipient_id', 'created_at'], unique=False)
        batch_op.create_index('ix_notifications_recipient_id_is_read', ['recipient_id', 'is_read'], unique=False)



def downgrade() -> None:
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_index('ix_notifications_recipient_id_is_read')
        batch_op.drop_index('ix_notifications_recipient_id_created_at')
        batch_op.drop_index(batch_op.f('ix_notifications_post_id'))
        batch_op.drop_index(batch_op.f('ix_notifications_comment_id'))
        batch_op.drop_index(batch_op.f('ix_notifications_actor_id'))

    op.drop_table('notifications')
    with op.batch_alter_table('reposts', schema=None) as batch_op:
        batch_op.drop_index('ix_reposts_user_id_created_at')
        batch_op.drop_index(batch_op.f('ix_reposts_post_id'))

    op.drop_table('reposts')
    with op.batch_alter_table('post_tags', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_post_tags_tag_id'))

    op.drop_table('post_tags')
    with op.batch_alter_table('likes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_likes_post_id'))

    op.drop_table('likes')
    with op.batch_alter_table('comments', schema=None) as batch_op:
        batch_op.drop_index('ix_comments_post_id_created_at')
        batch_op.drop_index(batch_op.f('ix_comments_post_id'))
        batch_op.drop_index(batch_op.f('ix_comments_parent_id'))
        batch_op.drop_index('ix_comments_author_id_created_at')
        batch_op.drop_index(batch_op.f('ix_comments_author_id'))

    op.drop_table('comments')
    with op.batch_alter_table('bookmarks', schema=None) as batch_op:
        batch_op.drop_index('ix_bookmarks_user_id_created_at')
        batch_op.drop_index(batch_op.f('ix_bookmarks_post_id'))

    op.drop_table('bookmarks')
    with op.batch_alter_table('profiles', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_profiles_avatar_media_id'))

    op.drop_table('profiles')
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_posts_image_media_id'))
        batch_op.drop_index(batch_op.f('ix_posts_created_at'))
        batch_op.drop_index('ix_posts_author_id_created_at')
        batch_op.drop_index(batch_op.f('ix_posts_author_id'))

    op.drop_table('posts')
    with op.batch_alter_table('drafts', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_drafts_image_media_id'))
        batch_op.drop_index('ix_drafts_author_id_updated_at')
        batch_op.drop_index(batch_op.f('ix_drafts_author_id'))

    op.drop_table('drafts')
    with op.batch_alter_table('user_settings', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_settings_discoverable'))

    op.drop_table('user_settings')
    with op.batch_alter_table('user_interests', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_interests_interest_id'))

    op.drop_table('user_interests')
    with op.batch_alter_table('tags', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_tags_slug'))
        batch_op.drop_index(batch_op.f('ix_tags_interest_id'))

    op.drop_table('tags')
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_refresh_tokens_user_id'))
        batch_op.drop_index(batch_op.f('ix_refresh_tokens_family_id'))

    op.drop_table('refresh_tokens')
    with op.batch_alter_table('password_reset_tokens', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_password_reset_tokens_user_id'))

    op.drop_table('password_reset_tokens')
    with op.batch_alter_table('media', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_media_owner_id'))

    op.drop_table('media')
    with op.batch_alter_table('follows', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_follows_followee_id'))

    op.drop_table('follows')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_username'))
        batch_op.drop_index(batch_op.f('ix_users_email'))
        batch_op.drop_index(batch_op.f('ix_users_created_at'))

    op.drop_table('users')
    with op.batch_alter_table('interests', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_interests_slug'))

    op.drop_table('interests')
    with op.batch_alter_table('ads', schema=None) as batch_op:
        batch_op.drop_index('ix_ads_is_active_placement')

    op.drop_table('ads')
