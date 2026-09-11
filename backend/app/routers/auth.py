from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.schemas.auth_schemas import UserRegisterIn, UserLoginIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        phone_number=payload.phone_number,
        age=payload.age,
        gender=payload.gender,
        occupation=payload.occupation,
        has_chronic_condition=payload.has_chronic_condition,
        outdoor_worker=payload.outdoor_worker,
        daily_outdoor_exposure_hours=payload.daily_outdoor_exposure_hours,
        ward_id=payload.ward_id,
        district_id=payload.district_id,
        state_id=payload.state_id,
        hospital_id=payload.hospital_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role.value)
    return TokenOut(access_token=token, role=user.role.value, user_id=user.id)


@router.post("/login", response_model=TokenOut)
def login(payload: UserLoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    token = create_access_token(subject=user.id, role=user.role.value)
    return TokenOut(access_token=token, role=user.role.value, user_id=user.id)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
