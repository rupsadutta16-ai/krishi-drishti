"""create ai_analyses table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-09 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('ai_analyses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('observation_id', sa.Integer(), nullable=False),
    sa.Column('predicted_disease', sa.String(length=255), nullable=True),
    sa.Column('predicted_pest', sa.String(length=255), nullable=True),
    sa.Column('disease_probability', sa.Float(), nullable=True),
    sa.Column('pest_probability', sa.Float(), nullable=True),
    sa.Column('risk_level', sa.String(length=50), nullable=True),
    sa.Column('confidence_score', sa.Float(), nullable=True),
    sa.Column('model_version', sa.String(length=100), nullable=False, server_default='v1.0.0'),
    sa.Column('status', sa.String(length=50), nullable=False, server_default='PENDING'),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['observation_id'], ['observations.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('ai_analyses')
