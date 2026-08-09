"""
创建第一个管理员账号的脚本
运行: python create_admin.py
"""
import sys
sys.path.append(".")

from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()

# 管理员信息（改成你自己的）
ADMIN_EMAIL = "admin@tukeng.com.cn"
ADMIN_PASSWORD = "admin123456"  # 改成你的密码
ADMIN_NAME = "管理员"

# 检查是否已存在
existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
if existing:
    print(f"管理员账号 {ADMIN_EMAIL} 已存在")
    db.close()
    exit(0)

# 创建管理员
admin = User(
    email=ADMIN_EMAIL,
    hashed_password=User.get_password_hash(ADMIN_PASSWORD),
    full_name=ADMIN_NAME,
    role="admin",
    status="active"
)
db.add(admin)
db.commit()

print(f"✅ 管理员账号创建成功！")
print(f"邮箱: {ADMIN_EMAIL}")
print(f"密码: {ADMIN_PASSWORD}")
print(f"\n请访问 https://tukeng.com.cn/auth 登录")

db.close()
