from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {}
pool_kwargs = {}

if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Render 免费 PG 限 5 连接，留 1 给迁移/调试
    pool_kwargs = {
        "pool_size": 2,
        "max_overflow": 2,
        "pool_timeout": 10,
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    **pool_kwargs,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
