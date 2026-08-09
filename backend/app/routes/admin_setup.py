"""
临时开放注册接口创建管理员
使用后立即删除此文件
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserResponse

router = APIRouter(prefix="/api/admin-setup", tags=["admin-setup"])


@router.post("/create-first-admin", response_model=UserResponse)
def create_first_admin(user_data: UserRegister, db: Session = Depends(get_db)):
    """创建第一个管理员账号（仅当没有任何管理员时可用）"""
    # 检查是否已有管理员
    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin already exists"
        )

    # 创建管理员
    user = User(
        email=user_data.email,
        hashed_password=User.get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role="admin",  # 管理员
        status="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
