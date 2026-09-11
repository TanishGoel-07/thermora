import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    HOSPITAL_ADMIN = "hospital_admin"
    DISTRICT_OFFICER = "district_officer"
    STATE_OFFICER = "state_officer"
    SUPER_ADMIN = "super_admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CITIZEN)
    phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    whatsapp_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)

    # Personal vulnerability profile used to personalize HTSI / Citizen Risk Engine
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(120), nullable=True)
    has_chronic_condition: Mapped[bool] = mapped_column(Boolean, default=False)
    outdoor_worker: Mapped[bool] = mapped_column(Boolean, default=False)
    daily_outdoor_exposure_hours: Mapped[float] = mapped_column(Integer, default=1)

    # Geo scope: citizens/hospital admins scope to a ward; district/state
    # officers scope to their district/state for the government dashboards.
    ward_id: Mapped[int | None] = mapped_column(ForeignKey("wards.id"), nullable=True)
    district_id: Mapped[int | None] = mapped_column(ForeignKey("districts.id"), nullable=True)
    state_id: Mapped[int | None] = mapped_column(ForeignKey("states.id"), nullable=True)
    hospital_id: Mapped[int | None] = mapped_column(ForeignKey("hospitals.id"), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
