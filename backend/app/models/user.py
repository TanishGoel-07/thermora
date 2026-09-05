import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, Float, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    HEALTH_OFFICER = "health_officer"
    HOSPITAL_STAFF = "hospital_staff"
    PUBLIC = "public"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.PUBLIC)
    phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Personal vulnerability profile used to personalize HTSI
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(120), nullable=True)
    has_chronic_condition: Mapped[bool] = mapped_column(Boolean, default=False)
    outdoor_worker: Mapped[bool] = mapped_column(Boolean, default=False)

    ward_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
