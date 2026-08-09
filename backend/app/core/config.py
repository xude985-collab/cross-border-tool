from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./cross_border.db"
    redis_url: str = "redis://localhost:6379/0"
    openai_api_key: str = ""
    fal_key: str = ""
    alibaba_app_key: str = ""
    alibaba_app_secret: str = ""
    aliexpress_app_key: str = ""
    aliexpress_app_secret: str = ""
    aliexpress_access_token: str = ""
    oss_access_key_id: str = ""
    oss_access_key_secret: str = ""
    oss_bucket_name: str = "cross-border-images"
    oss_endpoint: str = "https://oss-cn-hangzhou.aliyuncs.com"
    removebg_key: str = ""
    secret_key: str = "changeme"

    class Config:
        env_file = ".env"

settings = Settings()
