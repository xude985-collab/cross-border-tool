"""
速卖通开放平台API对接
文档: https://developers.aliexpress.com/
"""
import hashlib
import time
import json
import httpx
from app.core.config import settings


class AliexpressService:
    BASE_URL = "https://api-sg.aliexpress.com/sync"

    def __init__(self):
        self.app_key = settings.aliexpress_app_key
        self.app_secret = settings.aliexpress_app_secret
        self.access_token = settings.aliexpress_access_token

    def _sign(self, params: dict) -> str:
        sorted_params = sorted(params.items())
        sign_str = self.app_secret
        for k, v in sorted_params:
            sign_str += f"{k}{v}"
        sign_str += self.app_secret
        return hashlib.md5(sign_str.encode("utf-8")).hexdigest().upper()

    def _build_request(self, method: str, biz_params: dict) -> dict:
        params = {
            "app_key": self.app_key,
            "method": method,
            "access_token": self.access_token,
            "timestamp": str(int(time.time() * 1000)),
            "sign_method": "md5",
            "v": "2.0",
        }
        params.update(biz_params)
        params["sign"] = self._sign(params)
        return params

    async def post_product(self, product_payload: dict) -> dict:
        """发布新商品到速卖通"""
        params = self._build_request(
            "aliexpress.solution.product.post",
            {"productInfo": json.dumps(product_payload, ensure_ascii=False)}
        )
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(self.BASE_URL, data=params)
            resp.raise_for_status()
            data = resp.json()
            result = data.get("aliexpress_solution_product_post_response", {})
            if result.get("result", {}).get("success"):
                return {"product_id": result["result"].get("productId")}
            raise ValueError(f"速卖通上传失败: {result}")

    async def forecast_category(self, title: str, attributes: dict) -> str:
        """AI预测速卖通类目"""
        params = self._build_request(
            "aliexpress.postproduct.redefining.categoryforecast",
            {
                "subject": title,
                "locale": "en_US",
            }
        )
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self.BASE_URL, data=params)
            data = resp.json()
            result = data.get("aliexpress_postproduct_redefining_categoryforecast_response", {})
            cats = result.get("result", {}).get("recommendCategoryInfos", [])
            if cats:
                return str(cats[0].get("categoryId", ""))
            return ""

    def build_product_payload(self, product: dict, image_urls: dict) -> dict:
        """组装速卖通商品发布数据结构"""
        # 主图列表（最多6张）
        main_images = []
        if image_urls.get("white_bg_front"):
            main_images.append(image_urls["white_bg_front"])
        if image_urls.get("white_bg_back"):
            main_images.append(image_urls["white_bg_back"])
        if image_urls.get("front_back_merged"):
            main_images.append(image_urls["front_back_merged"])
        for url in (image_urls.get("scene_images") or [])[:2]:
            main_images.append(url)
        for url in (image_urls.get("detail_images") or [])[:1]:
            main_images.append(url)
        main_images = main_images[:6]

        # SKU列表
        sku_list = []
        for sku in product.get("skus", []):
            spec_en = sku.get("spec_en", sku.get("spec", {}))
            sku_list.append({
                "skuAttr": ";".join(f"{k}:{v}" for k, v in spec_en.items()),
                "price": round(sku.get("price", 0) * product.get("price_multiplier", 3.0), 2),
                "inventory": [{"quantity": sku.get("stock", 999)}],
            })

        # 详情HTML
        detail_html = "<div>"
        for url in (image_urls.get("detail_page_images") or []):
            detail_html += f'<img src="{url}" style="width:100%"/>'
        detail_html += "</div>"

        return {
            "subject": product.get("title_en", ""),
            "categoryID": product.get("category_id", ""),
            "productImage": {"imageURLs": main_images},
            "description": detail_html,
            "skuInfo": sku_list,
            "productAttributes": [
                {"attrName": k, "attrValue": v}
                for k, v in (product.get("attributes") or {}).items()
            ],
            "logisticsInfo": [{"logisticsServiceName": "Other", "freight": 0}],
        }


aliexpress_service = AliexpressService()
