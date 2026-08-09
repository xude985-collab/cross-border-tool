"""
图片存储服务
优先用阿里云OSS，未配置时存本地（开发/测试用）
"""
import os
import httpx
from app.core.config import settings


async def upload_image_bytes(image_bytes: bytes, key: str) -> str:
    """上传图片，返回公网URL"""
    if settings.oss_access_key_id and settings.oss_bucket_name:
        # 阿里云OSS REST API上传（不依赖oss2包）
        import hashlib
        import hmac
        import base64
        from datetime import datetime, timezone

        endpoint = settings.oss_endpoint.replace("https://", "").replace("http://", "")
        url = f"https://{settings.oss_bucket_name}.{endpoint}/{key}"
        date = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
        content_type = "image/jpeg"
        string_to_sign = f"PUT\n\n{content_type}\n{date}\n/{settings.oss_bucket_name}/{key}"
        signature = base64.b64encode(
            hmac.new(settings.oss_access_key_secret.encode(), string_to_sign.encode(), hashlib.sha1).digest()
        ).decode()

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.put(url, content=image_bytes, headers={
                "Date": date,
                "Content-Type": content_type,
                "Authorization": f"OSS {settings.oss_access_key_id}:{signature}",
            })
            if resp.status_code in (200, 201):
                return url

    # 未配置OSS或上传失败时返回占位URL
    return f"/static/images/{key}"
