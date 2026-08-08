from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.core.database import get_db
from app.models.product import Product, ProductStatus
from app.services.aliexpress import aliexpress_service

router = APIRouter()


class UploadIn(BaseModel):
    product_ids: List[int]


@router.post("/batch", summary="批量上传到速卖通")
async def batch_upload(data: UploadIn, db: Session = Depends(get_db)):
    """将已处理好的商品批量上传到速卖通"""
    results = {"success": [], "failed": []}

    for pid in data.product_ids:
        product = db.query(Product).filter(Product.id == pid).first()
        if not product or product.status != ProductStatus.ready:
            results["failed"].append({"id": pid, "reason": "商品未就绪"})
            continue

        try:
            product.status = ProductStatus.uploading
            db.commit()

            image_urls = {
                "white_bg_front": (product.images_white_bg or [None])[0],
                "white_bg_back": (product.images_white_bg or [None, None])[1] if len(product.images_white_bg or []) > 1 else None,
                "scene_images": product.images_scene or [],
                "detail_images": product.images_detail or [],
                "size_guide": (product.images_size_guide or [None])[0],
            }

            payload = aliexpress_service.build_product_payload(
                {
                    "title_en": product.title_en,
                    "category_id": product.category_id,
                    "skus": product.sku_data or [],
                    "attributes": product.original_attributes or {},
                    "price_multiplier": product.price_multiplier,
                },
                image_urls
            )
            resp = await aliexpress_service.post_product(payload)
            product.aliexpress_product_id = resp.get("product_id")
            product.status = ProductStatus.uploaded
            db.commit()
            results["success"].append({"id": pid, "aliexpress_id": product.aliexpress_product_id})

        except Exception as e:
            product.status = ProductStatus.failed
            product.upload_error = str(e)[:500]
            db.commit()
            results["failed"].append({"id": pid, "reason": str(e)[:200]})

    return results
