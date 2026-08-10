from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import products, batches, upload
from app.routes import users, admin_setup
from app.core.database import engine, Base
from sqlalchemy import inspect, text

# 初始化数据库：删掉所有旧表重建，避免enum冲突
def init_database():
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    # 只删 cross-border-tool 自己的表，不影响 luckybuy
    our_tables = {"users", "products", "batches"}
    tables_to_drop = [t for t in existing_tables if t in our_tables]
    if tables_to_drop:
        for table_name in tables_to_drop:
            with engine.connect() as conn:
                conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
                conn.commit()
    # 创建新表
    Base.metadata.create_all(bind=engine)

init_database()

app = FastAPI(title="跨境铺货SaaS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(batches.router, prefix="/api/batches", tags=["batches"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(users.router)  # 用户系统（已有prefix）
app.include_router(admin_setup.router)  # 临时：创建管理员（已有prefix）

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/debug-token")
def debug_token(token: str):
    from jose import jwt
    try:
        payload = jwt.decode(token, "cross-border-tool-jwt-secret-2024", algorithms=["HS256"])
        return {"ok": True, "payload": payload}
    except Exception as e:
        return {"ok": False, "error": str(e), "error_type": type(e).__name__}
