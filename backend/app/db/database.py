from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.DATABASE_URL
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


def _add_column_if_missing(connection, table: str, column: str, col_def: str) -> None:
    """Helper: ALTER TABLE only if the column does not yet exist."""
    inspector = inspect(connection)
    existing = {c["name"] for c in inspector.get_columns(table)}
    if column not in existing:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"))


def ensure_schema() -> None:
    """Create missing tables and patch columns that SQLAlchemy create_all won't migrate."""
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        inspector = inspect(conn)

        # ── farms.has_sensor ─────────────────────────────────────────
        if inspector.has_table("farms"):
            dialect = engine.dialect.name
            default_sql = "0" if dialect == "sqlite" else "FALSE"
            _add_column_if_missing(
                conn, "farms", "has_sensor",
                f"BOOLEAN NOT NULL DEFAULT {default_sql}"
            )

        # ── expert_profiles new columns ───────────────────────────────
        if inspector.has_table("expert_profiles"):
            _add_column_if_missing(conn, "expert_profiles", "phone", "VARCHAR(20)")
            _add_column_if_missing(conn, "expert_profiles", "address", "VARCHAR(255)")
            _add_column_if_missing(conn, "expert_profiles", "verification_doc_url", "VARCHAR(1024)")
            _add_column_if_missing(conn, "expert_profiles", "verification_doc_public_id", "VARCHAR(255)")


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
