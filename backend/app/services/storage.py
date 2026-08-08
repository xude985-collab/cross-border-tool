"""
图片上传到阿里云OSS
"""
import oss2
from app.core.config import settings

auth = oss2.Auth(settings.oss_access_key_id, settings.oss_access_key_secret)
bucket = oss2.Bucket(auth, settings.oss_endpoint, settings.oss_bucket_name)


async def upload_image_bytes(image_bytes: bytes, key: str) -> str:
    """上传图片bytes到OSS，返回公网URL"""
    bucket.put_object(key, image_bytes)
    return f"https://{settings.oss_bucket_name}.{settings.oss_endpoint.replace('https://', '')}/{key}"
