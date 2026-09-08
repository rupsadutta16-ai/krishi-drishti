"""create crops table

Revision ID: a1b2c3d4e5f6
Revises: 99d8ba9d6948
Create Date: 2026-09-09 01:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '99d8ba9d6948'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('crops',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('farm_id', sa.Integer(), nullable=False),
    sa.Column('crop_type', sa.String(length=50), nullable=False),
    sa.Column('variety', sa.String(length=100), nullable=True),
    sa.Column('sowing_date', sa.Date(), nullable=True),
    sa.Column('growth_stage', sa.String(length=50), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('crops')
