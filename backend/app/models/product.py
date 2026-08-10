import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProductStatus(str, enum.Enum):
    pending = "pending"       # 待处理
    fetching = "fetching"     # 抓取中
    ai_processing = "ai_processing"  # AI处理中
    ready = "ready"           # 待上传
    uploading = "uploading"   # 上传中
    uploaded = "uploaded"     # 已上传
    failed = "failed"         # 失败


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    alibaba_product_id = Column(String(64), unique=True, index=True)
    alibaba_url = Column(String(512))

    # 原始数据（来自1688）
    original_title_zh = Column(String(512))
    original_description = Column(Text)
    original_images = Column(JSON)        # 原始图片URL列表
    original_sku = Column(JSON)           # 原始SKU数据
    original_attributes = Column(JSON)    # 原始属性

    # AI生成内容
    title_en = Column(String(512))        # 英文标题
    title_zh = Column(String(512))        # 中文翻译
    description_en = Column(Text)         # 英文描述
    description_zh = Column(Text)         # 中文翻译
    bullet_points = Column(JSON)          # 卖点列表

    # AI生成图片（OSS URL）
    # 9张主图
    img_main_1 = Column(String(512))   # 正面模特白底图
    img_main_2 = Column(String(512))   # 背面模特白底图
    img_main_3 = Column(String(512))   # 正背面合并图
    img_main_4 = Column(String(512))   # 场景图1
    img_main_5 = Column(String(512))   # 场景图2
    img_main_6 = Column(String(512))   # 细节图1
    img_main_7 = Column(String(512))   # 细节图2
    img_main_8 = Column(String(512))   # 多场景合并图
    img_main_9 = Column(String(512))   # 尺码指引图
    # 其他
    img_white_1_1 = Column(String(512))  # 1:1 白底主图
    img_scene_3_4 = Column(String(512))  # 3:4 场景图
    # 10张详情图
    img_detail_1 = Column(String(512))
    img_detail_2 = Column(String(512))
    img_detail_3 = Column(String(512))
    img_detail_4 = Column(String(512))
    img_detail_5 = Column(String(512))
    img_detail_6 = Column(String(512))
    img_detail_7 = Column(String(512))
    img_detail_8 = Column(String(512))
    img_detail_9 = Column(String(512))
    img_detail_10 = Column(String(512))
    # 速卖通上传主图列表（最多6张，从main_1~9中选）
    images_listing = Column(JSON)

    # 价格/SKU
    price_source = Column(Float)          # 1688原价
    price_multiplier = Column(Float, default=3.0)
    price_final = Column(Float)           # 最终售价
    sku_data = Column(JSON)               # 处理后SKU

    # 速卖通相关
    category_id = Column(String(64))      # 速卖通类目ID
    aliexpress_product_id = Column(String(64))  # 上传后的商品ID
    upload_error = Column(Text)

    status = Column(String(32), default=ProductStatus.pending)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    batch = relationship("Batch", back_populates="products")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128))
    total = Column(Integer, default=0)
    fetched = Column(Integer, default=0)
    ai_done = Column(Integer, default=0)
    uploaded = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    status = Column(String(32), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = relationship("Product", back_populates="batch")
