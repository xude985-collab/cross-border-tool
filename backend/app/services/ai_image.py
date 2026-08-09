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
    """用 remove.bg API 抠图（免费50张/月），失败则返回原图"""
    try:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.remove.bg/v1.0/removebg",
                headers={"X-Api-Key": settings.removebg_key},
                files={"image_file": ("img.png", buf.getvalue(), "image/png")},
                data={"size": "auto"},
            )
            if resp.status_code == 200:
                return Image.open(io.BytesIO(resp.content)).convert("RGBA")
    except Exception:
        pass
    return img


def compose_on_white(fg: Image.Image, size=(800, 1000), padding=0.08) -> Image.Image:
    """将透明图贴到白底，等比缩放并居中"""
    w, h = size
    pad_x = int(w * padding)
    pad_y = int(h * padding)
    max_w, max_h = w - pad_x * 2, h - pad_y * 2
    fg_copy = fg.copy()
    fg_copy.thumbnail((max_w, max_h), Image.LANCZOS)
    canvas = Image.new("RGB", size, (255, 255, 255))
    px = (w - fg_copy.width) // 2
    py = (h - fg_copy.height) // 2
    canvas.paste(fg_copy, (px, py), fg_copy.split()[3])
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
    """调用 fal.ai Flux Pro 生成图片"""
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://fal.run/fal-ai/flux/dev",
            headers={"Authorization": f"Key {settings.fal_key}",
                     "Content-Type": "application/json"},
            json={"prompt": prompt, "image_size": aspect,
                  "num_images": 1, "enable_safety_checker": True},
        )
        resp.raise_for_status()
        data = resp.json()
        image_url = data["images"][0]["url"]
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

    # ---------- 抠图 ----------
    front_fg = await remove_background(front_img)
    back_fg = await remove_background(back_img)

    # ===== 主图1: 正面模特白底图 9:16竖版 =====
    main1 = compose_on_white(front_fg, (900, 1600))
    result["main_1"] = img_to_bytes(main1)

    # ===== 主图2: 背面模特白底图 =====
    main2 = compose_on_white(back_fg, (800, 1000))
    result["main_2"] = img_to_bytes(main2)

    # ===== 主图3: 正面+背面合并白底图 =====
    main3 = merge_two_images(main1, main2, (1600, 1000))
    result["main_3"] = img_to_bytes(main3)

    # ===== 主图4/5: 场景图（Flux Pro AI生成）=====
    style = attrs.get("风格", attrs.get("Style", "casual"))
    material = attrs.get("材质", attrs.get("面料", "fabric"))
    garment_desc = f"{title_en}, {style} style, {material} material"

    scenes = [
        ("urban street scene, city background, natural daylight", "portrait_4_3"),
        ("cozy indoor coffee shop, warm lighting, lifestyle photography", "portrait_4_3"),
    ]
    scene_imgs_bytes = []
    for scene_prompt, aspect in scenes:
        try:
            flux_prompt = (
                f"Professional fashion photography, female model wearing {garment_desc}, "
                f"{scene_prompt}, editorial style, high resolution commercial photo, 4k"
            )
            scene_bytes = await generate_flux_image(flux_prompt, aspect)
            scene_imgs_bytes.append(scene_bytes)
        except Exception as e:
            print(f"场景图生成失败: {e}")

    if len(scene_imgs_bytes) > 0:
        result["main_4"] = scene_imgs_bytes[0]
    if len(scene_imgs_bytes) > 1:
        result["main_5"] = scene_imgs_bytes[1]

    # ===== 主图6/7: 细节图（裁剪源图细节区域）=====
    for i, detail_idx in enumerate([2, 3]):
        src = source_imgs[detail_idx] if detail_idx < len(source_imgs) else source_imgs[-1]
        # 裁剪中心区域放大作为细节图
        w, h = src.size
        crop = src.crop((w // 6, h // 4, w * 5 // 6, h * 3 // 4)).convert("RGB")
        crop_resized = crop.resize((800, 800), Image.LANCZOS)
        result[f"main_{6+i}"] = img_to_bytes(crop_resized)

    # ===== 主图8: 多场景合并图 =====
    scene_pil_imgs = []
    for b in scene_imgs_bytes:
        scene_pil_imgs.append(Image.open(io.BytesIO(b)).convert("RGB"))
    # 补充白底图
    while len(scene_pil_imgs) < 2:
        scene_pil_imgs.append(main1)
    all_for_grid = [main1, main2] + scene_pil_imgs[:2]
    main8 = merge_four_scenes(all_for_grid, (1600, 1600))
    result["main_8"] = img_to_bytes(main8)

    # ===== 主图9: 尺码指引图 =====
    main9 = make_size_guide(skus, title_en)
    result["main_9"] = img_to_bytes(main9)

    # ===== 1:1 白底主图（速卖通封面）=====
    white_sq = compose_on_white(front_fg, (800, 800), padding=0.1)
    result["white_1_1"] = img_to_bytes(white_sq)

    # ===== 3:4 竖版场景图 =====
    try:
        scene_34_prompt = (
            f"Professional fashion photography, female model wearing {garment_desc}, "
            f"elegant outdoor scene, soft natural light, 3:4 vertical portrait, "
            f"high resolution commercial photography"
        )
        result["scene_3_4"] = await generate_flux_image(scene_34_prompt, "portrait_4_3")
    except Exception as e:
        print(f"3:4场景图生成失败: {e}")
        result["scene_3_4"] = img_to_bytes(compose_on_white(front_fg, (600, 800)))

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
