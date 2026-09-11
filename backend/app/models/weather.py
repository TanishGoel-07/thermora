from datetime import datetime

from sqlalchemy import Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WeatherObservation(Base):
    """Raw and derived weather data, sourced from NASA POWER (or local sensors)."""

    __tablename__ = "weather_observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ward_id: Mapped[int | None] = mapped_column(ForeignKey("wards.id"), nullable=True)
    district_id: Mapped[int | None] = mapped_column(ForeignKey("districts.id"), nullable=True)

    source: Mapped[str] = mapped_column(String(40), default="NASA_POWER")
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    observed_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    temperature_max_c: Mapped[float] = mapped_column(Float, nullable=True)
    temperature_min_c: Mapped[float] = mapped_column(Float, nullable=True)
    humidity_pct: Mapped[float] = mapped_column(Float, nullable=False)
    wind_speed_ms: Mapped[float] = mapped_column(Float, nullable=False)
    solar_radiation_wm2: Mapped[float] = mapped_column(Float, nullable=False)
    pressure_kpa: Mapped[float] = mapped_column(Float, nullable=True)
    rainfall_mm: Mapped[float] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
