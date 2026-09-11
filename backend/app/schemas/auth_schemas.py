from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole


class UserRegisterIn(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.CITIZEN
    phone_number: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    has_chronic_condition: bool = False
    outdoor_worker: bool = False
    daily_outdoor_exposure_hours: float = 1
    ward_id: Optional[int] = None
    district_id: Optional[int] = None
    state_id: Optional[int] = None
    hospital_id: Optional[int] = None


class UserLoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: str
    role: UserRole
    ward_id: Optional[int] = None
    district_id: Optional[int] = None
    state_id: Optional[int] = None
    hospital_id: Optional[int] = None
    is_active: bool
    created_at: datetime
