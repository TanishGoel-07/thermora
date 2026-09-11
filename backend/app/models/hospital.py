from datetime import datetime

from sqlalchemy import Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ward_id: Mapped[int] = mapped_column(ForeignKey("wards.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(60), default="general")  # general, govt, private, trauma
    total_beds: Mapped[int] = mapped_column(Integer, default=0)
    icu_beds: Mapped[int] = mapped_column(Integer, default=0)
    available_beds: Mapped[int] = mapped_column(Integer, default=0)
    available_icu_beds: Mapped[int] = mapped_column(Integer, default=0)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    contact_number: Mapped[str | None] = mapped_column(String(32), nullable=True)


class HospitalPrediction(Base):
    """Predicted heat-stroke case load and surge requirements for a hospital."""

    __tablename__ = "hospital_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hospital_id: Mapped[int] = mapped_column(ForeignKey("hospitals.id"), nullable=False)
    ward_id: Mapped[int] = mapped_column(ForeignKey("wards.id"), nullable=False)
    predicted_for_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    expected_heat_stroke_cases: Mapped[float] = mapped_column(Float, nullable=False)
    expected_admissions: Mapped[float] = mapped_column(Float, nullable=False)
    expected_icu_requirement: Mapped[float] = mapped_column(Float, nullable=False)
    expected_opd_demand: Mapped[float] = mapped_column(Float, default=0.0)
    projected_bed_occupancy_pct: Mapped[float] = mapped_column(Float, default=0.0)
    emergency_resource_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100 staffing/supply strain
    surge_risk_level: Mapped[str] = mapped_column(String(30), nullable=False)
    capacity_utilization_pct: Mapped[float] = mapped_column(Float, nullable=False)
