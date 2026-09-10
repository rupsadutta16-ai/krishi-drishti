"""create farm_soil_records table and fix expert roles

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-09-10 16:55:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    # 1. Create farm_soil_records table if not exists
    if "farm_soil_records" not in tables:
        op.create_table(
            "farm_soil_records",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("farm_id", sa.Integer(), nullable=False),
            sa.Column("sample_no", sa.String(length=100), nullable=True),
            sa.Column("test_date", sa.String(length=50), nullable=True),
            sa.Column("ph", sa.Float(), nullable=True),
            sa.Column("ec", sa.Float(), nullable=True),
            sa.Column("oc", sa.Float(), nullable=True),
            sa.Column("nitrogen", sa.Float(), nullable=True),
            sa.Column("phosphorus", sa.Float(), nullable=True),
            sa.Column("potassium", sa.Float(), nullable=True),
            sa.Column("sulphur", sa.Float(), nullable=True),
            sa.Column("zinc", sa.Float(), nullable=True),
            sa.Column("iron", sa.Float(), nullable=True),
            sa.Column("copper", sa.Float(), nullable=True),
            sa.Column("manganese", sa.Float(), nullable=True),
            sa.Column("boron", sa.Float(), nullable=True),
            sa.Column("soil_type", sa.String(length=100), nullable=True),
            sa.Column("texture", sa.String(length=100), nullable=True),
            sa.Column("moisture", sa.Float(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["farm_id"], ["farms.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("farm_id"),
        )


    # 2. Fix existing expert users in users table who had role incorrectly assigned as 'farmer'
    op.execute(
        "UPDATE users SET role = 'expert' WHERE id IN (SELECT user_id FROM expert_profiles) OR username ILIKE 'expert%'"
    )

    # 3. Ensure expert profiles exist for all users with role 'expert'
    op.execute(
        """
        INSERT INTO expert_profiles (user_id, specialization, qualification, organization, is_verified, created_at, updated_at)
        SELECT id, 'Plant Pathology & Agronomy', 'M.Sc. Agriculture', 'Krishi Extension Services', TRUE, NOW(), NOW()
        FROM users
        WHERE role = 'expert'
        AND id NOT IN (SELECT user_id FROM expert_profiles)
        """
    )


def downgrade() -> None:
    op.drop_table("farm_soil_records")
