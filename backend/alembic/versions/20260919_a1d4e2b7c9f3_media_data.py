"""Store image bytes in the media table (for hosts without a persistent disk)

Revision ID: a1d4e2b7c9f3
Revises: c57487890420
Create Date: 2026-09-19 20:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1d4e2b7c9f3"
down_revision: Union[str, None] = "c57487890420"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("media") as batch_op:
        batch_op.add_column(sa.Column("data", sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("media") as batch_op:
        batch_op.drop_column("data")
