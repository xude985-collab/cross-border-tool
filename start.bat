@echo off
echo ============================
echo  跨境铺货平台 - 启动
echo ============================

echo.
echo [1/3] 启动后端 API...
cd /d E:\cross_border_tool\backend
start "Backend" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] 启动 Celery Worker (AI处理队列)...
start "Worker" cmd /k "celery -A app.tasks.process.celery_app worker --loglevel=info --pool=solo"

echo [3/3] 启动前端...
cd /d E:\cross_border_tool\frontend
start "Frontend" cmd /k "npm run dev"

echo.
echo ============================
echo  全部启动完成！
echo  前端: http://localhost:3000
echo  后端: http://localhost:8000/docs
echo ============================
pause
