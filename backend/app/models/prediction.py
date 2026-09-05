from datetime import datetime

from sqlalchemy import Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HeatwavePrediction(Base):
    """Ensemble ML output for heatwave probability/severity for a ward + target date."""

    __tablename__ = "heatwave_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ward_id: Mapped[int] = mapped_column(ForeignKey("wards.id"), nullable=False)

    prediction_made_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    target_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    horizon_days: Mapped[int] = mapped_column(Integer, nullable=False)

    heatwave_probability: Mapped[float] = mapped_column(Float, nullable=False)  # 0-1
    severity_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    severity_level: Mapped[str] = mapped_column(String(30), nullable=False)
    estimated_duration_days: Mapped[float] = mapped_column(Float, nullable=False)

    xgb_probability: Mapped[float] = mapped_column(Float, nullable=True)
    rf_probability: Mapped[float] = mapped_column(Float, nullable=True)
    lstm_probability: Mapped[float] = mapped_column(Float, nullable=True)
    model_version: Mapped[str] = mapped_column(String(40), default="v1")
