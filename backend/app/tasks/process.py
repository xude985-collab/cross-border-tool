"""
Celery 核心处理任务
每个商品的完整处理流水线: 1688抓取 → AI文本 → AI图片 → 标记就绪
"""
import asyncio
import io
from celery import Celery
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.product import Product, ProductStatus

celery_app = Celery("tasks", broker=settings.redis_url, backend=settings.redis_url)


def run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(bind=True, max_retries=3)
def process_product_task(self, product_id: int):
    """完整处理单个商品"""
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return

        # Step 1: 抓取1688数据
        product.status = ProductStatus.fetching
        db.commit()

        from app.services.alibaba import alibaba_service
        data = run_async(alibaba_service.get_product(product.alibaba_product_id))

        product.original_title_zh = data["title_zh"]
        product.original_description = data["description"]
        product.original_images = data["images"]
        product.original_sku = data["skus"]
        product.original_attributes = data["attributes"]
        product.price_source = data["price_min"]
        db.commit()

        # Step 2: AI生成文本
        product.status = ProductStatus.ai_processing
        db.commit()

        from app.services.ai_text import generate_title, generate_description, translate_sku_attributes
        title_result = run_async(generate_title(data))
        desc_result = run_async(generate_description(data))
        sku_translated = run_async(translate_sku_attributes(data["skus"]))

        product.title_en = title_result["title_en"]
        product.title_zh = title_result["title_zh"]
        product.description_en = desc_result["description_en"]
        product.description_zh = desc_result["description_zh"]
        product.bullet_points = desc_result["bullet_points"]
        product.sku_data = sku_translated
        product.price_final = round((data["price_min"] or 10) * product.price_multiplier, 2)
        db.commit()

        # Step 3: AI图片处理（9张主图 + 10张详情图 + 1:1白底 + 3:4场景图）
        from app.services.ai_image import process_all_images
        from app.services.storage import upload_image_bytes

        product_data_for_img = {
            "title_zh": data["title_zh"],
            "title_en": product.title_en or "",
            "images": data["images"],
            "attributes": data["attributes"],
            "skus": sku_translated,
            "bullet_points": desc_result.get("bullet_points", []),
        }
        img_result = run_async(process_all_images(product_data_for_img))

        # 上传所有图片到OSS，写入对应字段
        for key, val in img_result.items():
            if isinstance(val, bytes):
                url = run_async(upload_image_bytes(val, f"products/{product_id}/{key}.jpg"))
                if hasattr(product, key):
                    setattr(product, key, url)

        # 组装速卖通上传主图列表（取前6张：主图1/2/3/4/5/9）
        listing_imgs = [
            getattr(product, f"img_main_{i}", None)
            for i in [1, 2, 3, 4, 5, 9]
        ]
        product.images_listing = [u for u in listing_imgs if u][:6]

        # Step 4: 预测速卖通类目
        from app.services.aliexpress import aliexpress_service
        try:
            cat_id = run_async(aliexpress_service.forecast_category(
                product.title_en or "", data["attributes"]
            ))
            product.category_id = cat_id
        except Exception:
            pass

        product.status = ProductStatus.ready
        db.commit()

    except Exception as exc:
        db.query(Product).filter(Product.id == product_id).update({
            "status": ProductStatus.failed,
            "upload_error": str(exc)[:500],
        })
        db.commit()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()
