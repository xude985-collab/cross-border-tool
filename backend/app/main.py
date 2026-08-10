from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import products, batches, upload
from app.routes import users, admin_setup
from app.core.database import engine, Base
import sqlalchemy

# 智能建表：已有表跳过，只创建缺失的
from app.models.product import Product, Batch
from app.models.user import User

for table in Base.metadata.sorted_tables:
    try:
        table.create(bind=engine, checkfirst=True)
    except Exception:
        pass

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
