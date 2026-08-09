"""
后台处理任务（无 Celery/Redis 依赖，用 asyncio 后台运行）
每个商品的完整处理流水线: 1688抓取 → AI文本 → AI图片 → 标记就绪
"""
import asyncio
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.product import Product, ProductStatus


async def process_product_task(product_id: int, source_url: str, data: dict):
    """后台处理单个商品"""
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return

        product.status = ProductStatus.ai_processing
        db.commit()

        # Step 1: AI文本生成
        from app.services.ai_text import generate_product_text

        text_result = await generate_product_text(data)
        product.title_en = text_result.get("title_en", "")
        product.description_en = text_result.get("description_en", "")
        product.description_zh = text_result.get("description_zh", "")
        product.bullet_points = text_result.get("bullet_points", [])
        product.aliexpress_attrs = text_result.get("attributes", {})

        # SKU翻译
        sku_translated = text_result.get("skus", data.get("skus", []))
        product.sku_data = sku_translated
        db.commit()

        # Step 2: AI图片处理
        from app.services.ai_image import process_all_images
        from app.services.storage import upload_image_bytes

        desc_result = text_result
        product_data_for_img = {
            "title_zh": data.get("title_zh", ""),
            "title_en": product.title_en or "",
            "images": data.get("images", []),
            "attributes": data.get("attributes", {}),
            "skus": sku_translated,
            "bullet_points": desc_result.get("bullet_points", []),
        }
        img_result = await process_all_images(product_data_for_img)

        # 上传所有图片到OSS
        for key, val in img_result.items():
            if isinstance(val, bytes):
                url = await upload_image_bytes(val, f"products/{product_id}/{key}.jpg")
                col_name = f"img_{key}" if not key.startswith("img_") else key
                if hasattr(product, col_name):
                    setattr(product, col_name, url)

        # 组装速卖通上传主图列表
        listing_imgs = [
            getattr(product, f"img_main_{i}", None)
            for i in [1, 2, 3, 4, 5, 9]
        ]
        product.images_listing = [u for u in listing_imgs if u][:6]

        # Step 3: 类目预测
        try:
            from app.services.aliexpress import predict_category
            cat_id = await predict_category(product.title_en)
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
    finally:
        db.close()


def start_processing(product_id: int, source_url: str, data: dict):
    """启动后台处理（非阻塞）"""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.ensure_future(process_product_task(product_id, source_url, data))
    else:
        loop.run_until_complete(process_product_task(product_id, source_url, data))
