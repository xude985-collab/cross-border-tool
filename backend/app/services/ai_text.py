"""
AI标题和描述生成服务 - 严格按照用户需求

标题公式: 核心卖点 + 对象 + 产品特征 + 热搜词 + 长尾词
描述内容: 产品特征 + 洗护说明 + 尺码建议 + 场景用途，末尾附中文翻译
"""
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)


TITLE_PROMPT = """你是亚马逊跨境电商爆款标题专家，精通服装品类。

商品信息：
- 原始标题（中文）：{title_zh}
- 类目：{category}
- 材质：{material}
- 风格：{style}
- 季节：{season}
- 适用人群：{target}
- 颜色：{colors}
- 主要特点：{features}

请严格按照以下公式生成英文标题：
【核心卖点】+【对象（男/女）】+【产品特点】+【热搜词】+【长尾词】

比如中文逻辑：单连衣裙 女性 有口袋 高弹性 夏季可游泳
对应英文：One Piece Dress Women Pockets High Elastic Summer Swimwear Beach Cover Up

规则：
1. 总字符数不超过200个字符
2. Title Case（每个实义词首字母大写）
3. 不使用促销词（Best/Top/Sale/Cheap/Free）
4. 核心关键词放前面（权重最高）
5. 包含2-3个亚马逊高搜索量关键词
6. 必须包含性别词（Women/Men/Girls/Boys）

示例参考：
Women's Oversized Linen Blazer Jacket 2024 Summer Lightweight Breathable Business Casual Office Long Sleeve Single Breasted Loose Fit Outerwear

输出格式（仅输出这两行，不要其他内容）：
英文标题：[标题内容]
中文翻译：[对应中文]"""


DESCRIPTION_PROMPT = """你是亚马逊跨境电商产品文案专家，专注服装品类。

商品信息：
- 商品名称：{title_zh}
- 材质属性：{material}
- 风格特点：{features}
- 原始描述：{description}

请生成完整英文产品说明，包含以下所有部分：

【PRODUCT FEATURES】（产品特征 - 5条卖点，每条以✓开头，25-40字）
【FABRIC & MATERIAL】（面料材质说明 - 2-3句，描述手感/透气性/质地）
【CARE INSTRUCTIONS】（洗护说明 - 5条，用数字编号）
  1. 水洗温度建议
  2. 漂白说明
  3. 烘干建议
  4. 熨烫说明
  5. 干洗说明
【SIZE TIPS】（尺码建议 - 2-3句，建议参考尺码表）
【OCCASIONS】（适用场景 - 3-4个场景，逗号分隔）

最后输出：
=== 中文翻译 ===
（上述所有内容的中文翻译）

注意：英文在前，中文翻译在后，之间用"=== 中文翻译 ==="分隔"""


CATEGORY_ATTRIBUTE_PROMPT = """根据以下服装商品信息，输出速卖通商品属性的英文值。

商品：{title_zh}
原始属性：{attributes}

请输出以下标准属性的英文值（JSON格式）：
- Gender: Women/Men/Unisex/Girls/Boys
- Season: Spring/Summer/Autumn/Winter/All Seasons
- Style: Casual/Formal/Sports/Bohemian/Elegant/Streetwear/...
- Collar: V-Neck/Round Neck/Turtleneck/Lapel/...
- Sleeve Length: Sleeveless/Short Sleeve/Long Sleeve/3/4 Sleeve/...
- Sleeve Style: Regular/Puff/Flare/...
- Fit Type: Regular/Slim/Loose/Oversized
- Pattern: Solid/Striped/Floral/Plaid/...
- Fabric: Cotton/Polyester/Linen/Chiffon/...
- Thickness: Thin/Regular/Thick/Padded
- Wash Care: Machine Wash/Hand Wash/Dry Clean Only
- Origin: CN (China)

只输出JSON，key为属性名，value为对应英文值："""


async def generate_title(product_data: dict) -> dict:
    """生成亚马逊爆款英文标题 + 中文翻译"""
    attrs = product_data.get("attributes", {})
    prompt = TITLE_PROMPT.format(
        title_zh=product_data.get("title_zh", ""),
        category=product_data.get("category", "Women's Clothing"),
        material=attrs.get("材质", attrs.get("面料", attrs.get("Material", ""))),
        style=attrs.get("风格", attrs.get("Style", "")),
        season=attrs.get("季节", attrs.get("Season", "")),
        target=attrs.get("适用人群", attrs.get("Gender", "Women")),
        colors=", ".join([s.get("spec", {}).get("颜色", "") for s in product_data.get("skus", [])[:5] if s]),
        features=str({k: v for k, v in list(attrs.items())[:8]}),
    )
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=400,
    )
    text = resp.choices[0].message.content.strip()
    title_en, title_zh = "", ""
    for line in text.split("\n"):
        line = line.strip()
        if line.startswith("英文标题："):
            title_en = line.replace("英文标题：", "").strip()
        elif line.startswith("中文翻译："):
            title_zh = line.replace("中文翻译：", "").strip()
    return {"title_en": title_en, "title_zh": title_zh}


async def generate_description(product_data: dict) -> dict:
    """生成产品说明（特征/洗护/尺码/场景）+ 中文翻译"""
    attrs = product_data.get("attributes", {})
    prompt = DESCRIPTION_PROMPT.format(
        title_zh=product_data.get("title_zh", ""),
        material=attrs.get("材质", attrs.get("面料", "")),
        features=str({k: v for k, v in list(attrs.items())[:10]}),
        description=product_data.get("description", "")[:800],
    )
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1500,
    )
    text = resp.choices[0].message.content.strip()
    parts = text.split("=== 中文翻译 ===")
    desc_en = parts[0].strip()
    desc_zh = parts[1].strip() if len(parts) > 1 else ""
    bullets = [line.strip() for line in desc_en.split("\n") if line.strip().startswith("✓")]
    return {"description_en": desc_en, "description_zh": desc_zh, "bullet_points": bullets}


async def generate_attributes(product_data: dict) -> dict:
    """生成速卖通标准属性（英文）"""
    import json
    prompt = CATEGORY_ATTRIBUTE_PROMPT.format(
        title_zh=product_data.get("title_zh", ""),
        attributes=str(product_data.get("attributes", )),
    )
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=400,
    )
    try:
        return json.loads(resp.choices[0].message.content.strip())
    except Exception:
        return {}


async def translate_sku_attributes(sku_data: list) -> list:
    """翻译SKU颜色/尺码为英文"""
    import json
    if not sku_data:
        return sku_data
    all_values = set()
    for sku in sku_data:
        for v in sku.get("spec", {}).values():
            if v:
                all_values.add(str(v))
    if not all_values:
        return sku_data
    prompt = f"将以下中文服装属性值翻译为标准英文，输出JSON格式（键为中文，值为英文）：{list(all_values)}\n只输出JSON。"
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0, max_tokens=300,
    )
    try:
        trans_map = json.loads(resp.choices[0].message.content.strip())
    except Exception:
        return sku_data
    result = []
    for sku in sku_data:
        spec_en = {k: trans_map.get(v, v) for k, v in sku.get("spec", {}).items()}
        result.append({**sku, "spec_en": spec_en})
    return result
