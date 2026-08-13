from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.product import Product, Batch, ProductStatus
from app.services.alibaba import alibaba_service
from app.tasks.process import start_processing

router = APIRouter(dependencies=[Depends(get_current_user)])


class ProductUrlsIn(BaseModel):
    urls: List[str]
    batch_name: str = "批次"
    price_multiplier: float = 3.0


class ProductOut(BaseModel):
    id: int
    alibaba_product_id: str
    title_zh: str | None
    title_en: str | None
    status: str
    images_listing: list | None

    class Config:
        from_attributes = True


@router.post("/import", summary="批量导入1688商品链接")
async def import_products(data: ProductUrlsIn, db: Session = Depends(get_db)):
    """接受1688链接列表，创建批次，异步抓取+AI处理"""
    batch = Batch(name=data.batch_name, total=len(data.urls))
    db.add(batch)
    db.commit()
    db.refresh(batch)

    product_ids = []
    for url in data.urls:
        try:
            pid = alibaba_service.extract_product_id(url)
        except ValueError:
            continue
        product = Product(
            alibaba_product_id=pid,
            alibaba_url=url,
            status=ProductStatus.pending,
            price_multiplier=data.price_multiplier,
            batch_id=batch.id,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        product_ids.append(product.id)

    # 批量启动后台处理（带并发限制）
    for pid in product_ids:
        p = db.query(Product).filter(Product.id == pid).first()
        start_processing(p.id, p.alibaba_url, {"title_zh": p.original_title_zh or ""})

    return {"batch_id": batch.id, "queued": len(product_ids)}


@router.get("/{product_id}", response_model=ProductOut, summary="获取商品详情")
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "商品不存在")
    return p


@router.get("/batch/{batch_id}", summary="获取批次内所有商品")
def get_batch_products(batch_id: int, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.batch_id == batch_id).all()
    return [{"id": p.id, "status": p.status, "title_en": p.title_en,
             "title_zh": p.original_title_zh} for p in products]


@router.put("/{product_id}", summary="编辑商品（仿速卖通编辑器保存）")
def update_product(product_id: int, updates: dict, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "商品不存在")
    allowed = {"title_en", "title_zh", "description_en", "price_final",
               "sku_data", "category_id", "images_listing"}
    for k, v in updates.items():
        if k in allowed:
            setattr(p, k, v)
    db.commit()
    return {"ok": True}
