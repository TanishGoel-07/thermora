from datetime import datetime

from sqlalchemy import Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ThermalStressRecord(Base):
    """Computed human thermal-stress metrics for a ward at a point in time."""

    __tablename__ = "thermal_stress_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ward_id: Mapped[int] = mapped_column(ForeignKey("wards.id"), nullable=False)
    weather_observation_id: Mapped[int | None] = mapped_column(
        ForeignKey("weather_observations.id"), nullable=True
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    heat_index_c: Mapped[float] = mapped_column(Float, nullable=False)
    wbgt_c: Mapped[float] = mapped_column(Float, nullable=False)
    utci_c: Mapped[float] = mapped_column(Float, nullable=False)

    htsi_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    htsi_category: Mapped[str] = mapped_column(String(30), nullable=False)

    # contribution breakdown (0-100, sums roughly to 100)
    contrib_temperature: Mapped[float] = mapped_column(Float, default=0.0)
    contrib_humidity: Mapped[float] = mapped_column(Float, default=0.0)
    contrib_wind: Mapped[float] = mapped_column(Float, default=0.0)
    contrib_solar_radiation: Mapped[float] = mapped_column(Float, default=0.0)
    contrib_personal_vulnerability: Mapped[float] = mapped_column(Float, default=0.0)

    recommendation: Mapped[str] = mapped_column(String(1000), nullable=True)
