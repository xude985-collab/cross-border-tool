# 跨境铺货 SaaS 平台

从 1688 批量抓取商品 → AI 自动优化（标题/描述/图片）→ 一键上传速卖通

## 快速启动

### 1. 配置环境变量
```bash
cp backend/.env.example backend/.env
# 填写 .env 中的所有 KEY
```

### 2. 启动所有服务
```bash
docker-compose up -d
```

### 3. 访问
- 前端：http://localhost:3000
- 后端 API 文档：http://localhost:8000/docs

---

## 使用流程

1. 打开 http://localhost:3000
2. 点击「新建批次」→ 粘贴 1688 商品链接（每行一个，支持 100-500 个）
3. 设置定价倍率（如 3x 表示 1688 价格 × 3 = 速卖通售价）
4. 点击「开始批量处理」→ 系统自动：
   - 调用 1688 API 获取商品数据
   - GPT-4o-mini 生成英文标题 + 描述
   - Rembg 抠图生成白底图
   - Flux Pro 生成场景图
   - 自动生成尺码指引图
5. 等待状态变为「就绪」（绿色）
6. 点击「一键上传全部就绪」→ 批量上传到速卖通

---

## 项目结构

```
cross_border_tool/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI 路由
│   │   │   ├── products.py   # 商品导入/编辑
│   │   │   ├── batches.py    # 批次管理
│   │   │   └── upload.py     # 速卖通上传
│   │   ├── services/      # 核心服务
│   │   │   ├── alibaba.py    # 1688 API
│   │   │   ├── ai_text.py    # GPT-4o-mini 标题/描述
│   │   │   ├── ai_image.py   # 图片处理（Rembg+Flux）
│   │   │   ├── aliexpress.py # 速卖通 API
│   │   │   └── storage.py    # 阿里云 OSS
│   │   ├── models/        # 数据库模型
│   │   ├── tasks/         # Celery 异步任务
│   │   └── core/          # 配置/数据库
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # 批次管理首页
│   │   ├── import/page.tsx   # 导入页面
│   │   ├── batch/[id]/page.tsx   # 批次详情+上传
│   │   └── product/[id]/page.tsx # 商品编辑器（仿速卖通）
│   └── lib/api.ts            # API 调用封装
└── docker-compose.yml
```

## 需要填写的 API Keys（backend/.env）

| Key | 获取方式 |
|-----|---------|
| OPENAI_API_KEY | platform.openai.com |
| FAL_KEY | fal.ai |
| ALIBABA_APP_KEY/SECRET | open.1688.com 申请应用 |
| ALIEXPRESS_APP_KEY/SECRET | developers.aliexpress.com |
| ALIEXPRESS_ACCESS_TOKEN | OAuth 授权流程获取 |
| OSS_* | 阿里云控制台 |
