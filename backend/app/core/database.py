"""SQLAlchemy engine, session factory and declarative base.

SQLite for local development and self-hosting on one server; PostgreSQL (Neon) on Vercel.
"""

from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import MetaData, create_engine, event
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def create_db_engine(url: str, echo: bool = False) -> Engine:
    if make_url(url).get_backend_name() == "postgresql":
        return create_engine(
            url,
            echo=echo,
            # Serverless instances sleep; check connections before use and recycle them early.
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=5,
            pool_recycle=300,
            # Neon's pooler (PgBouncer in transaction mode) cannot keep prepared statements.
            connect_args={"prepare_threshold": None},
        )

    database = make_url(url).database
    in_memory = not database or database == ":memory:"
    if not in_memory:
        Path(database).parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(
        url,
        echo=echo,
        connect_args={"check_same_thread": False, "timeout": 15},
        poolclass=StaticPool if in_memory else None,
    )

    @event.listens_for(engine, "connect")
    def _configure_sqlite(dbapi_connection, _record) -> None:  # pragma: no cover - driver hook
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=5000")
        if not in_memory:
            # WAL lets readers keep working while a request writes.
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

    return engine


engine = create_db_engine(settings.database_url, settings.database_echo)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
