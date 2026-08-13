"""
1688开放平台API对接
文档: https://open.1688.com/api/
"""
import hashlib
import time
import httpx
from typing import Optional
from app.core.config import settings


class Alibaba1688Service:
    BASE_URL = "https://gw.open.1688.com/openapi/param2/1/com.alibaba.product"

    def __init__(self):
        self.app_key = settings.alibaba_app_key
        self.app_secret = settings.alibaba_app_secret

    def _sign(self, params: dict) -> str:
        """生成请求签名"""
        sorted_params = sorted(params.items())
        sign_str = self.app_secret
        for k, v in sorted_params:
            sign_str += f"{k}{v}"
        sign_str += self.app_secret
        return hashlib.md5(sign_str.encode("utf-8")).hexdigest().upper()

    def _build_params(self, api_params: dict) -> dict:
        params = {
            "_aop_appkey": self.app_key,
            "_aop_timestamp": str(int(time.time() * 1000)),
            **api_params,
        }
        params["_aop_signature"] = self._sign(params)
        return params

    async def get_product(self, product_id: str) -> dict:
        """获取单个商品详情"""
        params = self._build_params({
            "productID": product_id,
            "webSite": "1688",
        })
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.BASE_URL}/alibaba.product.get/param2/1/com.alibaba.product/alibaba.product.get/{self.app_key}",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("result", {}).get("success"):
                return self._parse_product(data["result"])
            raise ValueError(f"1688 API 错误: {data}")

    async def get_products_batch(self, product_ids: list[str]) -> list[dict]:
        """批量获取商品（限 3 并发避免被封）"""
        import asyncio
        sem = asyncio.Semaphore(3)

        async def limited(pid):
            async with sem:
                return await self.get_product(pid)

        tasks = [limited(pid) for pid in product_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if not isinstance(r, Exception)]

    def _parse_product(self, raw: dict) -> dict:
        """将1688原始数据解析为标准格式"""
        product = raw.get("productInfo", {})
        sku_info = raw.get("productSKUInfos", [])

        # 提取主图
        images = []
        if product.get("image"):
            img = product["image"]
            images = img.get("images", []) or [img.get("imageUri", "")]

        # 提取SKU
        skus = []
        for sku in sku_info:
            spec_values = {}
            for attr in sku.get("skuAttributes", []):
                spec_values[attr.get("attributeName", "")] = attr.get("value", "")
            skus.append({
                "spec": spec_values,
                "price": sku.get("price", 0),
                "stock": sku.get("amountOnSale", 0),
                "sku_id": sku.get("skuId", ""),
                "image": sku.get("imageUrl", ""),
            })

        # 提取属性
        attributes = {}
        for attr in product.get("productAttribute", {}).get("attributes", []):
            attributes[attr.get("attributeName", "")] = attr.get("value", "")

        return {
            "product_id": str(product.get("productID", "")),
            "title_zh": product.get("subject", ""),
            "description": product.get("description", ""),
            "images": [img for img in images if img],
            "skus": skus,
            "attributes": attributes,
            "category": product.get("categoryID", ""),
            "price_min": min([s["price"] for s in skus], default=0),
        }

    @staticmethod
    def extract_product_id(url_or_id: str) -> str:
        """从URL或ID字符串中提取商品ID"""
        url_or_id = url_or_id.strip()
        if url_or_id.isdigit():
            return url_or_id
        # 从URL提取，如 https://detail.1688.com/offer/123456789.html
        import re
        match = re.search(r"/offer/(\d+)\.html", url_or_id)
        if match:
            return match.group(1)
        match = re.search(r"offerId=(\d+)", url_or_id)
        if match:
            return match.group(1)
        raise ValueError(f"无法从 '{url_or_id}' 提取商品ID")


alibaba_service = Alibaba1688Service()
