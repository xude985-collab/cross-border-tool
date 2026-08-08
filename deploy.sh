#!/bin/bash
# ====================================================
# 跨境铺货 SaaS 平台 - 一键部署脚本（Ubuntu/Debian）
# 适用于：甲骨文ARM / GCP / 阿里云 等Linux服务器
# 使用方法：
#   1. SSH 到你的服务器
#   2. 执行: bash deploy.sh
# ====================================================

set -e
echo "=============================="
echo " 跨境铺货平台 - 一键部署"
echo "=============================="

# --- 1. 安装 Docker（如果没装）---
if ! command -v docker &> /dev/null; then
    echo "[1/5] 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker 安装完成，请重新登录SSH后再次运行此脚本"
    exit 0
else
    echo "[1/5] Docker 已安装 ✓"
fi

# --- 2. 安装 Docker Compose（如果没装）---
if ! command -v docker compose &> /dev/null; then
    echo "[2/5] 安装 Docker Compose..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
else
    echo "[2/5] Docker Compose 已安装 ✓"
fi

# --- 3. 创建项目目录 ---
echo "[3/5] 创建项目目录..."
PROJECT_DIR="$HOME/cross_border_tool"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# --- 4. 创建 docker-compose.yml ---
echo "[4/5] 生成 Docker Compose 配置..."
cat > docker-compose.yml << 'COMPOSE_EOF'
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: crossborder
      POSTGRES_PASSWORD: crossborder123
      POSTGRES_DB: cross_border
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crossborder"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always

  backend:
    build: ./backend
    restart: always
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  worker:
    build: ./backend
    restart: always
    command: celery -A app.tasks.process.celery_app worker --loglevel=info --concurrency=2 --pool=solo
    env_file:
      - ./backend/.env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://tukeng.com.cn
    depends_on:
      - backend

  # Nginx 反向代理（绑定域名/80端口用）
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend

volumes:
  pgdata:
COMPOSE_EOF

# --- 5. 创建 Nginx 配置 ---
cat > nginx.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name tukeng.com.cn www.tukeng.com.cn;

    # 前端
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端API
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    # 后端API文档
    location /docs {
        proxy_pass http://backend:8000/docs;
    }
    location /openapi.json {
        proxy_pass http://backend:8000/openapi.json;
    }

    # 健康检查
    location /health {
        proxy_pass http://backend:8000/health;
    }
}
NGINX_EOF

# --- 6. 检查 .env 文件 ---
if [ ! -f ./backend/.env ]; then
    echo ""
    echo "=============================="
    echo " ⚠️  请先配置 API Key！"
    echo "=============================="
    echo ""
    echo "执行以下命令编辑配置："
    echo "  nano $PROJECT_DIR/backend/.env"
    echo ""
    echo "填写以下内容（把xxx替换为你的真实Key）："
    echo ""
    mkdir -p backend
    cat > backend/.env << 'ENV_EOF'
DATABASE_URL=postgresql://crossborder:crossborder123@db:5432/cross_border
REDIS_URL=redis://redis:6379/0

# === 以下需要你填写真实的Key ===

# OpenAI（AI标题/描述生成）
OPENAI_API_KEY=sk-xxx

# fal.ai（AI图片生成）
FAL_KEY=xxx

# 1688开放平台
ALIBABA_APP_KEY=xxx
ALIBABA_APP_SECRET=xxx

# 速卖通开放平台
ALIEXPRESS_APP_KEY=xxx
ALIEXPRESS_APP_SECRET=xxx
ALIEXPRESS_ACCESS_TOKEN=xxx

# 阿里云OSS（存储AI生成的图片）
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_BUCKET_NAME=cross-border-images
OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com

SECRET_KEY=change-this-to-random-string
ENV_EOF
    echo "配置文件已生成: $PROJECT_DIR/backend/.env"
    echo ""
    echo "填好Key后再次运行: bash deploy.sh"
    exit 0
fi

# --- 7. 检查代码是否已上传 ---
if [ ! -f ./backend/requirements.txt ]; then
    echo ""
    echo "=============================="
    echo " ⚠️  请先上传代码！"
    echo "=============================="
    echo ""
    echo "在你本地电脑执行（把 YOUR_SERVER_IP 换成你的服务器IP）："
    echo ""
    echo "  scp -r E:\\cross_border_tool\\backend ubuntu@YOUR_SERVER_IP:~/cross_border_tool/"
    echo "  scp -r E:\\cross_border_tool\\frontend ubuntu@YOUR_SERVER_IP:~/cross_border_tool/"
    echo ""
    echo "或者用 Git 上传到 GitHub 再在服务器 git clone"
    echo ""
    exit 0
fi

# --- 8. 开放防火墙端口 ---
echo "[5/5] 配置防火墙..."
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT 2>/dev/null || true

# --- 9. 构建并启动 ---
echo ""
echo "开始构建并启动所有服务..."
echo "（首次构建需要5-15分钟，请耐心等待）"
echo ""
docker compose up -d --build

echo ""
echo "=============================="
echo " ✅ 部署完成！"
echo "=============================="
echo ""
echo " 访问地址: http://$(curl -s ifconfig.me)"
echo " API文档:  http://$(curl -s ifconfig.me)/docs"
echo ""
echo " 查看日志: docker compose logs -f"
echo " 停止服务: docker compose down"
echo " 重启服务: docker compose restart"
echo ""
