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


def ensure_schema() -> None:
    """Create missing tables and add columns that create_all will not migrate."""
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if not inspector.has_table("farms"):
        return

    farm_columns = {col["name"] for col in inspector.get_columns("farms")}
    if "has_sensor" in farm_columns:
        return

    dialect = engine.dialect.name
    default_sql = "0" if dialect == "sqlite" else "FALSE"
    with engine.begin() as connection:
        connection.execute(
            text(
                f"ALTER TABLE farms ADD COLUMN has_sensor BOOLEAN NOT NULL DEFAULT {default_sql}"
            )
        )


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
