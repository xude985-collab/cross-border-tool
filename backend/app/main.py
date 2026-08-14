from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import products, batches, upload
from app.routes import users, admin_setup
from app.core.database import engine, Base

app = FastAPI(title="跨境铺货SaaS", version="1.0.0")


@app.on_event("startup")
def init_database():
    """幂等建表：只创建缺失的表，绝不删除已存在的表/数据。"""
    import sys
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database ready (create_all, no drop)", file=sys.stderr)
    except Exception as e:
        print(f"⚠ Database init error: {e}", file=sys.stderr)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tukeng.com.cn",
        "https://www.tukeng.com.cn",
        "https://cross-border-tool-one.vercel.app",
        "https://cross-border-tool-r4d2.vercel.app",
        "http://localhost:3000",
    ],
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

@app.get("/debug/env-check")
def env_check():
    """临时调试：检查关键环境变量是否配置"""
    from app.core.config import settings
    return {
        "openai_key_exists": bool(settings.openai_api_key and len(settings.openai_api_key) > 10),
        "fal_key_exists": bool(settings.fal_key and len(settings.fal_key) > 10),
        "oss_configured": bool(settings.oss_access_key_id and settings.oss_access_key_secret),
        "alibaba_configured": bool(settings.alibaba_app_key and settings.alibaba_app_secret),
        "aliexpress_configured": bool(settings.aliexpress_app_key and settings.aliexpress_app_secret),
    }
