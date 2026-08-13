"""
AI图片处理服务 - 严格按照规格生成

主图9张（按序编号）：
  1. 产品正面白底图 9:16竖版（900×1600）
  2. 产品反面白底图
  3. 正反面一起的白底图
  4. 产品场景图（户外/街拍）
  5. 不同的场景图（室内/生活）
  6. 产品细节图（面料/工艺特写）
  7. 产品细节图（装饰/局部特写）
  8. 多场景的场景图（4张小图拼接）
  9. 亚马逊跨境电商尺码指引图

其他：
  - 1:1 白底主图（速卖通/亚马逊封面用）
  - 3:4 场景图（竖版场景图）
  - 10张详情图（产品卖点+细节展示）
"""
import io
import httpx
import asyncio
from PIL import Image, ImageDraw, ImageFont
from app.core.config import settings


async def download_image(url: str) -> Image.Image:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, follow_redirects=True)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content)).convert("RGBA")


async def remove_background(img: Image.Image) -> Image.Image:
    """不再需要抠图，直接返回原图"""
    return img


def has_model(img: Image.Image) -> bool:
    """简易检测图片是否有模特（根据图片宽高比和肤色像素占比判断）"""
    rgb = img.convert("RGB").resize((200, 200))
    pixels = list(rgb.getdata())
    skin_count = 0
    for r, g, b in pixels:
        # 肤色检测（简易HSV范围）
        if r > 95 and g > 40 and b > 20 and max(r, g, b) - min(r, g, b) > 15 and abs(r - g) > 15 and r > g and r > b:
            skin_count += 1
    skin_ratio = skin_count / len(pixels)
    # 肤色占比>5%认为有模特
    return skin_ratio > 0.05


# 模特特征随机组合池（排列组合可生成 10000+ 种不重复模特）
MODEL_ETHNICITY = ["asian", "caucasian", "african", "latina", "middle eastern", "southeast asian", "korean", "japanese", "chinese", "indian", "brazilian", "scandinavian", "mediterranean", "eastern european", "mixed race"]
MODEL_BUILD = ["slim", "petite", "medium", "athletic", "tall slim", "curvy", "lean"]
MODEL_HAIR = ["long straight black hair", "short bob hair", "wavy brown hair", "curly hair", "shoulder length hair", "ponytail", "long blonde hair", "pixie cut", "braided hair", "messy bun", "straight brown hair", "long wavy hair", "bangs with straight hair", "side part long hair"]
MODEL_POSE = ["standing straight", "slight turn", "hands on hips", "casual stance", "one hand in pocket", "arms relaxed", "confident pose", "gentle pose", "walking pose", "leaning slightly", "crossed arms relaxed", "hands behind back"]
MODEL_AGE = ["young", "early 20s", "mid 20s", "late 20s", "early 30s"]


def get_random_model_desc(seed: int) -> str:
    """根据seed生成随机模特描述，同一seed结果一致，不同seed不重复"""
    import random
    rng = random.Random(seed)
    ethnicity = rng.choice(MODEL_ETHNICITY)
    build = rng.choice(MODEL_BUILD)
    hair = rng.choice(MODEL_HAIR)
    pose = rng.choice(MODEL_POSE)
    age = rng.choice(MODEL_AGE)
    return f"{age} {ethnicity} woman, {build} build, {hair}, {pose}, front view"


async def ensure_model_image(img: Image.Image, garment_desc: str, idx: int) -> Image.Image:
    """
    确保图片有模特：
    - 如果原图有模特 → 直接返回
    - 如果没有模特 → 用虚拟试穿把这件真实衣服穿到AI模特身上
    """
    if has_model(img):
        return img

    # 没有模特，用虚拟试穿：真实衣服 + AI模特 → 模特穿真实衣服
    try:
        import base64

        # Step 1: 生成一个AI模特（穿基础衣服的全身照）
        seed = hash(garment_desc) % 999999 + idx
        model_desc = get_random_model_desc(seed)
        model_prompt = (
            f"Professional fashion photography, {model_desc}, "
            f"wearing plain white t-shirt and beige pants, full body shot, "
            f"white background, high resolution, 4k, studio lighting"
        )
        async with httpx.AsyncClient(timeout=120) as client:
            model_resp = await client.post(
                "https://fal.run/fal-ai/flux/dev",
                headers={"Authorization": f"Key {settings.fal_key}",
                         "Content-Type": "application/json"},
                json={"prompt": model_prompt, "image_size": "portrait_4_3",
                      "num_images": 1, "enable_safety_checker": True},
            )
            model_resp.raise_for_status()
            model_url = model_resp.json()["images"][0]["url"]

            # Step 2: 把真实衣服图片转为base64
            buf = io.BytesIO()
            img.convert("RGB").save(buf, format="JPEG", quality=90)
            garment_b64 = base64.b64encode(buf.getvalue()).decode()

            # Step 3: 调用虚拟试穿API，把真实衣服穿到模特身上
            tryon_resp = await client.post(
                "https://fal.run/fal-ai/kolors-virtual-tryon",
                headers={"Authorization": f"Key {settings.fal_key}",
                         "Content-Type": "application/json"},
                json={
                    "human_image_url": model_url,
                    "garment_image_url": f"data:image/jpeg;base64,{garment_b64}",
                },
            )
            tryon_resp.raise_for_status()
            result_url = tryon_resp.json()["image"]["url"]

            # 下载结果图片
            img_resp = await client.get(result_url)
            return Image.open(io.BytesIO(img_resp.content)).convert("RGBA")

    except Exception as e:
        print(f"虚拟试穿失败: {e}，使用原图")
        return img


def compose_on_white(fg: Image.Image, size=(800, 1000), padding=0.08) -> Image.Image:
    """将图片贴到白底，等比缩放并居中"""
    w, h = size
    pad_x = int(w * padding)
    pad_y = int(h * padding)
    max_w, max_h = w - pad_x * 2, h - pad_y * 2
    fg_copy = fg.copy()
    fg_copy.thumbnail((max_w, max_h), Image.LANCZOS)
    canvas = Image.new("RGB", size, (255, 255, 255))
    px = (w - fg_copy.width) // 2
    py = (h - fg_copy.height) // 2
    if fg_copy.mode == "RGBA":
        canvas.paste(fg_copy, (px, py), fg_copy.split()[3])
    else:
        canvas.paste(fg_copy.convert("RGB"), (px, py))
    return canvas


def merge_two_images(img1: Image.Image, img2: Image.Image,
                     size=(1600, 1000), gap=20) -> Image.Image:
    """横向合并两张图（正反面）"""
    cell_w = (size[0] - gap) // 2
    cell_h = size[1]
    canvas = Image.new("RGB", size, (255, 255, 255))
    for i, img in enumerate([img1, img2]):
        img_fit = img.copy()
        img_fit.thumbnail((cell_w - 40, cell_h - 40), Image.LANCZOS)
        x = i * (cell_w + gap) + (cell_w - img_fit.width) // 2
        y = (cell_h - img_fit.height) // 2
        canvas.paste(img_fit, (x, y))
    return canvas


def merge_four_scenes(imgs: list, size=(1600, 1600)) -> Image.Image:
    """4张场景图2×2拼接成多场景合并图"""
    cell_w, cell_h = size[0] // 2, size[1] // 2
    canvas = Image.new("RGB", size, (250, 250, 250))
    positions = [(0, 0), (cell_w, 0), (0, cell_h), (cell_w, cell_h)]
    for i, img in enumerate(imgs[:4]):
        img_fit = img.copy()
        img_fit.thumbnail((cell_w - 4, cell_h - 4), Image.LANCZOS)
        x, y = positions[i]
        px = x + (cell_w - img_fit.width) // 2
        py = y + (cell_h - img_fit.height) // 2
        canvas.paste(img_fit, (px, py))
    return canvas


def make_size_guide(skus: list, title: str, size=(1200, 800)) -> Image.Image:
    """生成尺码指引图"""
    canvas = Image.new("RGB", size, (255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    # 顶部深色条
    draw.rectangle([0, 0, size[0], 70], fill=(30, 30, 50))
    draw.text((30, 15), "SIZE GUIDE", fill=(255, 255, 255))
    draw.text((30, 40), title[:50], fill=(180, 180, 200))

    # 提取尺码列表
    sizes = []
    seen = set()
    for sku in skus:
        spec = sku.get("spec_en") or sku.get("spec") or {}
        size_val = spec.get("Size") or spec.get("尺码") or spec.get("尺寸") or ""
        if size_val and size_val not in seen:
            sizes.append(size_val)
            seen.add(size_val)

    # 标准尺码数据（cm）
    SIZE_DATA = {
        "XS":  {"Bust": 80, "Waist": 62, "Hip": 86, "Length": 58},
        "S":   {"Bust": 84, "Waist": 66, "Hip": 90, "Length": 59},
        "M":   {"Bust": 88, "Waist": 70, "Hip": 94, "Length": 60},
        "L":   {"Bust": 92, "Waist": 74, "Hip": 98, "Length": 61},
        "XL":  {"Bust": 96, "Waist": 78, "Hip": 102, "Length": 62},
        "XXL": {"Bust": 100, "Waist": 82, "Hip": 106, "Length": 63},
        "XXXL":{"Bust": 104, "Waist": 86, "Hip": 110, "Length": 64},
    }

    headers = ["Size", "Bust(cm)", "Waist(cm)", "Hip(cm)", "Length(cm)"]
    col_w, row_h = 200, 55
    start_x, start_y = 40, 110

    # 画表头
    for ci, h in enumerate(headers):
        x = start_x + ci * col_w
        draw.rectangle([x, start_y, x + col_w - 2, start_y + row_h - 2], fill=(50, 100, 200))
        draw.text((x + 10, start_y + 16), h, fill=(255, 255, 255))

    # 画数据行
    for ri, sz in enumerate(sizes[:8]):
        y = start_y + (ri + 1) * row_h
        data = SIZE_DATA.get(sz.upper(), {"Bust": "-", "Waist": "-", "Hip": "-", "Length": "-"})
        row_vals = [sz, str(data["Bust"]), str(data["Waist"]), str(data["Hip"]), str(data["Length"])]
        bg = (245, 248, 255) if ri % 2 == 0 else (255, 255, 255)
        for ci, val in enumerate(row_vals):
            x = start_x + ci * col_w
            draw.rectangle([x, y, x + col_w - 2, y + row_h - 2], fill=bg)
            draw.text((x + 10, y + 16), val, fill=(30, 30, 50))

    # 底部提示
    draw.text((40, start_y + 9 * row_h + 10),
              "* All measurements are in centimeters. Please allow 1-2cm difference due to manual measurement.",
              fill=(150, 150, 150))
    return canvas


def make_detail_page_image(index: int, title_en: str,
                           content_img: Image.Image = None,
                           text_lines: list = None,
                           accent_color=(50, 100, 200)) -> Image.Image:
    """生成单张详情图（800×800），带标题+内容"""
    canvas = Image.new("RGB", (800, 800), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    detail_titles = [
        "PRODUCT OVERVIEW",
        "FABRIC & MATERIAL",
        "DESIGN DETAILS",
        "SIZE & FIT",
        "STYLE INSPIRATION",
        "CARE INSTRUCTIONS",
        "MULTI-OCCASION WEAR",
        "QUALITY ASSURANCE",
        "PACKAGING",
        "WHY CHOOSE US",
    ]
    title = detail_titles[index] if index < len(detail_titles) else f"DETAIL {index+1}"

    # 顶部色条
    draw.rectangle([0, 0, 800, 80], fill=accent_color)
    draw.text((30, 22), f"{index+1:02d}  {title}", fill=(255, 255, 255))
    draw.text((730, 28), title_en[:15], fill=(200, 220, 255))

    # 内容图片
    if content_img:
        img_fit = content_img.copy().convert("RGB")
        img_fit.thumbnail((760, 600), Image.LANCZOS)
        px = (800 - img_fit.width) // 2
        canvas.paste(img_fit, (px, 100))

    # 文字说明
    if text_lines:
        y = 720 if content_img else 120
        for line in text_lines[:3]:
            draw.text((30, y), f"• {line[:70]}", fill=(60, 60, 80))
            y += 28

    return canvas


async def generate_flux_image(prompt: str, aspect: str = "square_hd") -> bytes:
    """
    用 DALL-E 3 生成图片（替代原 Flux）
    aspect: "square_hd" (1024x1024) | "portrait_16_9" (1024x1792竖版) | "landscape_16_9" (1792x1024横版)
    """
    # 映射到 DALL-E 3 的尺寸格式
    size_map = {
        "square_hd": "1024x1024",
        "square": "1024x1024",
        "portrait_16_9": "1024x1792",
        "portrait_9_16": "1024x1792",
        "portrait_4_3": "1024x1792",
        "landscape_16_9": "1792x1024",
        "landscape_4_3": "1792x1024",
    }
    size = size_map.get(aspect, "1024x1024")

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "dall-e-3",
                "prompt": prompt,
                "n": 1,
                "size": size,
                "quality": "hd",
            }
        )
        resp.raise_for_status()
        data = resp.json()
        image_url = data["data"][0]["url"]

        # 下载生成的图片
        ir = await client.get(image_url)
        return ir.content


def img_to_bytes(img: Image.Image, fmt="JPEG", quality=92) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt, quality=quality)
    return buf.getvalue()


async def process_all_images(product_data: dict) -> dict:
    """
    完整图片处理流水线，返回所有类型图片的bytes。

    返回字段：
      main_1  ~ main_9  : 9张主图
      white_1_1         : 1:1白底主图
      scene_3_4         : 3:4竖版场景图
      detail_1 ~ detail_10: 10张详情图
    """
    source_urls = product_data.get("images", [])
    if not source_urls:
        return {}

    result = {}
    title_en = product_data.get("title_en", product_data.get("title_zh", "clothing"))
    attrs = product_data.get("attributes", {})
    skus = product_data.get("skus", [])

    # ---------- 下载源图 ----------
    source_imgs = []
    for url in source_urls[:8]:
        try:
            img = await download_image(url)
            source_imgs.append(img)
        except Exception:
            pass
    if not source_imgs:
        return {}

    front_img = source_imgs[0]
    back_img = source_imgs[1] if len(source_imgs) > 1 else source_imgs[0]

    # ---------- 确保有模特（没模特自动AI生成）----------
    style = attrs.get("风格", attrs.get("Style", "casual"))
    material = attrs.get("材质", attrs.get("面料", "fabric"))
    garment_desc = f"{title_en}, {style} style, {material} material"

    front_img = await ensure_model_image(front_img, garment_desc, idx=0)
    back_img = await ensure_model_image(back_img, garment_desc + ", back view", idx=1)

    # 所有主图统一 9:16 竖版 (900×1600)，全部带模特
    IMG_SIZE = (900, 1600)

    # ---------- 裁剪为9:16 ----------
    def crop_to_9_16(img: Image.Image) -> Image.Image:
        w, h = img.size
        target_ratio = 9 / 16
        current_ratio = w / h
        if current_ratio > target_ratio:
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        else:
            new_h = int(w / target_ratio)
            top = (h - new_h) // 4
            img = img.crop((0, top, w, top + new_h))
        return img.convert("RGB").resize(IMG_SIZE, Image.LANCZOS)

    # ===== 主图1: 正面模特白底图 9:16 =====
    main1 = crop_to_9_16(front_img)
    result["main_1"] = img_to_bytes(main1)

    # ===== 主图2: 背面模特白底图 9:16 =====
    main2 = crop_to_9_16(back_img)
    result["main_2"] = img_to_bytes(main2)

    # ===== 主图3: 正面+背面模特合并白底图 9:16 =====
    main3 = merge_two_images(main1, main2, IMG_SIZE, gap=10)
    result["main_3"] = img_to_bytes(main3)

    # ===== 主图4/5: 模特场景图 9:16（AI生成，带模特）=====
    scenes = [
        "urban street scene, city background, natural daylight, full body model shot",
        "cozy indoor coffee shop, warm lighting, lifestyle photography, full body model shot",
    ]
    scene_imgs_bytes = []
    for scene_prompt in scenes:
        try:
            flux_prompt = (
                f"Professional fashion photography, female model wearing {garment_desc}, "
                f"{scene_prompt}, 9:16 vertical portrait, editorial style, "
                f"high resolution commercial photo, full body visible, 4k"
            )
            scene_bytes = await generate_flux_image(flux_prompt, "portrait_9_16")
            scene_imgs_bytes.append(scene_bytes)
        except Exception as e:
            print(f"场景图生成失败: {e}")

    if len(scene_imgs_bytes) > 0:
        result["main_4"] = scene_imgs_bytes[0]
    if len(scene_imgs_bytes) > 1:
        result["main_5"] = scene_imgs_bytes[1]

    # ===== 主图6/7: 模特细节图 9:16（裁剪源图保留模特）=====
    for i, detail_idx in enumerate([2, 3]):
        src = source_imgs[detail_idx] if detail_idx < len(source_imgs) else source_imgs[-1]
        # 保留模特，裁剪为9:16竖版
        w, h = src.size
        target_ratio = 9 / 16
        current_ratio = w / h
        if current_ratio > target_ratio:
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            crop = src.crop((left, 0, left + new_w, h))
        else:
            new_h = int(w / target_ratio)
            top = (h - new_h) // 4  # 偏上裁剪保留模特头部
            crop = src.crop((0, top, w, top + new_h))
        crop_resized = crop.convert("RGB").resize(IMG_SIZE, Image.LANCZOS)
        result[f"main_{6+i}"] = img_to_bytes(crop_resized)

    # ===== 主图8: 多场景模特合并图 9:16 =====
    scene_pil_imgs = []
    for b in scene_imgs_bytes:
        scene_pil_imgs.append(Image.open(io.BytesIO(b)).convert("RGB"))
    while len(scene_pil_imgs) < 2:
        scene_pil_imgs.append(main1)
    all_for_grid = [main1, main2] + scene_pil_imgs[:2]
    main8 = merge_four_scenes(all_for_grid, IMG_SIZE)
    result["main_8"] = img_to_bytes(main8)

    # ===== 主图9: 尺码指引图 9:16（带模特轮廓）=====
    main9 = make_size_guide(skus, title_en, IMG_SIZE)
    result["main_9"] = img_to_bytes(main9)

    # ===== 1:1 白底模特主图（模特穿衣服，白底）=====
    white_sq = compose_on_white(front_img, (800, 800), padding=0.05)
    result["white_1_1"] = img_to_bytes(white_sq)

    # ===== 3:4 模特场景图（模特穿衣服的场景图）=====
    try:
        scene_34_prompt = (
            f"Professional fashion photography, female model wearing {garment_desc}, "
            f"elegant outdoor scene, soft natural light, full body model shot, "
            f"3:4 vertical portrait, high resolution commercial photography, 4k"
        )
        result["scene_3_4"] = await generate_flux_image(scene_34_prompt, "portrait_4_3")
    except Exception as e:
        print(f"3:4场景图生成失败: {e}")
        # 失败时用抠图模特贴白底
        result["scene_3_4"] = img_to_bytes(compose_on_white(front_img, (750, 1000)))

    # ===== 10张详情图 =====
    detail_content_imgs = source_imgs[2:] if len(source_imgs) > 2 else source_imgs
    bullet_points = product_data.get("bullet_points", [])

    for idx in range(10):
        content_img = detail_content_imgs[idx % len(detail_content_imgs)]
        lines = bullet_points[idx:idx+1] if idx < len(bullet_points) else []
        detail_img = make_detail_page_image(
            idx, title_en[:20], content_img.convert("RGB"), lines
        )
        result[f"detail_{idx+1}"] = img_to_bytes(detail_img)

    return result
