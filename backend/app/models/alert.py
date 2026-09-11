import enum
from datetime import datetime

from sqlalchemy import Integer, Float, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AlertLevel(str, enum.Enum):
    SAFE = "safe"
    CAUTION = "caution"
    DANGER = "danger"
    EXTREME_DANGER = "extreme_danger"


class AlertChannel(str, enum.Enum):
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"
    WHATSAPP = "whatsapp"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ward_id: Mapped[int] = mapped_column(ForeignKey("wards.id"), nullable=False)
    level: Mapped[AlertLevel] = mapped_column(Enum(AlertLevel), nullable=False)
    htsi_score: Mapped[float] = mapped_column(Float, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(String(1000), nullable=False)
    recommended_action: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class AlertDelivery(Base):
    __tablename__ = "alert_deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[int] = mapped_column(ForeignKey("alerts.id"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    channel: Mapped[AlertChannel] = mapped_column(Enum(AlertChannel), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, sent, failed
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
