"""
用户相关 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import create_access_token, get_current_user, get_current_admin
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/register", response_model=UserResponse)
def register(
    user_data: UserRegister,
    current_admin: User = Depends(get_current_admin),  # 只有管理员能创建用户
    db: Session = Depends(get_db)
):
    """管理员创建用户"""
    # 检查邮箱是否已存在
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 创建新用户
    user = User(
        email=user_data.email,
        hashed_password=User.get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role="user",  # 默认普通用户
        status="active"  # 默认启用
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not user.check_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if user.status == "disabled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    # 生成 token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return current_user


@router.get("/", response_model=List[UserResponse])
def list_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """管理员：查看所有用户"""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: int,
    status: str,  # "active" or "disabled"
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """管理员：启用/禁用用户"""
    if status not in ["active", "disabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'disabled'"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.role == "admin" and user.id != current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot disable other admins"
        )

    user.status = status
    db.commit()
    return {"message": f"User {user.email} is now {status}"}
