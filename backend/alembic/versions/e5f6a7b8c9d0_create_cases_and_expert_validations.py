"""create agricultural_cases and expert_validations tables

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-10 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    # 1. Create agricultural_cases table
    if "agricultural_cases" not in tables:
        op.create_table(
            "agricultural_cases",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("farmer_id", sa.Integer(), nullable=False),
            sa.Column("farm_id", sa.Integer(), nullable=False),
            sa.Column("crop_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="open"),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("NOW()"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("NOW()"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(
                ["farmer_id"], ["users.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(
                ["farm_id"], ["farms.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(
                ["crop_id"], ["crops.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_agricultural_cases_id"), "agricultural_cases", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_agricultural_cases_farmer_id"),
            "agricultural_cases",
            ["farmer_id"],
            unique=False,
        )

    # 2. Add FK constraint on observations.case_id → agricultural_cases.id
    obs_indices = [ix["name"] for ix in inspector.get_indexes("observations")]
    if "ix_observations_case_id" not in obs_indices:
        op.create_index(
            op.f("ix_observations_case_id"), "observations", ["case_id"], unique=False
        )
    obs_fks = [fk["name"] for fk in inspector.get_foreign_keys("observations")]
    if "fk_observations_case_id_agricultural_cases" not in obs_fks:
        op.create_foreign_key(
            "fk_observations_case_id_agricultural_cases",
            "observations",
            "agricultural_cases",
            ["case_id"],
            ["id"],
            ondelete="SET NULL",
        )

    # 3. Create expert_validations table
    if "expert_validations" not in tables:
        op.create_table(
            "expert_validations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("case_id", sa.Integer(), nullable=False),
            sa.Column("observation_id", sa.Integer(), nullable=True),
            sa.Column("expert_id", sa.Integer(), nullable=False),
            sa.Column("validation_result", sa.String(length=50), nullable=False),
            sa.Column("corrected_disease", sa.String(length=255), nullable=True),
            sa.Column("corrected_pest", sa.String(length=255), nullable=True),
            sa.Column("comments", sa.Text(), nullable=True),
            sa.Column("treatment_recommendation", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("NOW()"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(
                ["case_id"], ["agricultural_cases.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(
                ["observation_id"], ["observations.id"], ondelete="SET NULL"
            ),
            sa.ForeignKeyConstraint(
                ["expert_id"], ["users.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_expert_validations_id"), "expert_validations", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_expert_validations_case_id"),
            "expert_validations",
            ["case_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_expert_validations_observation_id"),
            "expert_validations",
            ["observation_id"],
            unique=False,
        )



def downgrade() -> None:
    op.drop_table("expert_validations")
    op.drop_constraint(
        "fk_observations_case_id_agricultural_cases",
        "observations",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_observations_case_id"), table_name="observations")
    op.drop_index(
        op.f("ix_agricultural_cases_farmer_id"), table_name="agricultural_cases"
    )
    op.drop_index(
        op.f("ix_agricultural_cases_id"), table_name="agricultural_cases"
    )
    op.drop_table("agricultural_cases")
