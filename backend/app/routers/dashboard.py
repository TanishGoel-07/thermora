from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.thermal import ThermalStressRecord
from app.models.geography import Ward
from app.models.alert import Alert
from app.models.weather import WeatherObservation
from app.schemas.schemas import KPIOut, AlertOut, WardRiskOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=KPIOut)
def get_kpis(db: Session = Depends(get_db)):
    latest = (
        db.execute(select(ThermalStressRecord).order_by(desc(ThermalStressRecord.recorded_at)).limit(1))
        .scalars()
        .first()
    )
    if not latest:
        return KPIOut(
            current_heat_risk=0,
            current_heat_risk_level="Safe",
            htsi_score=0,
            htsi_category="Safe",
            heat_index_c=0,
            wbgt_c=0,
            utci_c=0,
        )
    return KPIOut(
        current_heat_risk=latest.htsi_score,
        current_heat_risk_level=latest.htsi_category,
        htsi_score=latest.htsi_score,
        htsi_category=latest.htsi_category,
        heat_index_c=latest.heat_index_c,
        wbgt_c=latest.wbgt_c,
        utci_c=latest.utci_c,
    )


@router.get("/active-alert", response_model=AlertOut | None)
def get_active_alert(db: Session = Depends(get_db)):
    alert = (
        db.execute(
            select(Alert).where(Alert.is_active.is_(True)).order_by(desc(Alert.created_at)).limit(1)
        )
        .scalars()
        .first()
    )
    return alert


@router.get("/top-risk-wards", response_model=list[WardRiskOut])
def get_top_risk_wards(limit: int = 5, db: Session = Depends(get_db)):
    # Latest thermal stress record per ward, ranked descending
    subq = (
        select(
            ThermalStressRecord.ward_id,
            ThermalStressRecord.htsi_score,
            ThermalStressRecord.htsi_category,
            ThermalStressRecord.heat_index_c,
        )
        .order_by(ThermalStressRecord.ward_id, desc(ThermalStressRecord.recorded_at))
        .distinct(ThermalStressRecord.ward_id)
    )
    rows = db.execute(subq).all()
    rows_sorted = sorted(rows, key=lambda r: r.htsi_score, reverse=True)[:limit]

    ward_ids = [r.ward_id for r in rows_sorted]
    wards = {w.id: w for w in db.query(Ward).filter(Ward.id.in_(ward_ids)).all()}

    results = []
    for i, r in enumerate(rows_sorted, start=1):
        ward = wards.get(r.ward_id)
        results.append(
            WardRiskOut(
                ward_id=r.ward_id,
                ward_name=ward.name if ward else f"Ward {r.ward_id}",
                rank=i,
                risk_score=r.htsi_score,
                severity=r.htsi_category,
                htsi_score=r.htsi_score,
                heat_index_c=r.heat_index_c,
            )
        )
    return results
