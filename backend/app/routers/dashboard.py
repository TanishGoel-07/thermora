from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.thermal import ThermalStressRecord
from app.models.geography import Ward
from app.models.alert import Alert
from app.schemas.schemas import KPIOut, AlertOut, WardRiskOut
from app.core.cache import cache_response

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=KPIOut)
@cache_response(ttl_seconds=15, key="dashboard:kpis")
def get_kpis(ward_id: int, db: Session = Depends(get_db)):
    """
    Root-cause fix for the "only Sanjay Nagar updates" bug: this endpoint
    previously ignored location entirely and always returned the single most
    recently written ThermalStressRecord across ALL wards — so whichever
    ward's background job happened to run last silently "won" for every
    user, regardless of which ward they had selected. `ward_id` is now
    required and scopes the query correctly, and the response is cached
    per-ward (not globally) so switching wards always reflects fresh data.
    """
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    latest = (
        db.execute(
            select(ThermalStressRecord)
            .where(ThermalStressRecord.ward_id == ward_id)
            .order_by(desc(ThermalStressRecord.recorded_at))
            .limit(1)
        )
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
def get_active_alert(ward_id: int, db: Session = Depends(get_db)):
    """Also previously unscoped — now correctly filters by the selected ward."""
    alert = (
        db.execute(
            select(Alert)
            .where(Alert.is_active.is_(True), Alert.ward_id == ward_id)
            .order_by(desc(Alert.created_at))
            .limit(1)
        )
        .scalars()
        .first()
    )
    return alert


@router.get("/top-risk-wards", response_model=list[WardRiskOut])
def get_top_risk_wards(limit: int = 5, district_id: int | None = None, db: Session = Depends(get_db)):
    """
    Cross-ward ranking (correctly ward-aware already), now additionally
    scopable to a single district so a State Officer viewing "all of Uttar
    Pradesh" doesn't see Delhi wards mixed into a district-level widget.
    """
    ward_scope_query = db.query(Ward.id)
    if district_id is not None:
        ward_scope_query = ward_scope_query.filter(Ward.district_id == district_id)
    scoped_ward_ids = {row[0] for row in ward_scope_query.all()} if district_id is not None else None

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
    if scoped_ward_ids is not None:
        rows = [r for r in rows if r.ward_id in scoped_ward_ids]
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
