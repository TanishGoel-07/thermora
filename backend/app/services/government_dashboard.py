from __future__ import annotations

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.models.geography import District, State, Ward
from app.models.thermal import ThermalStressRecord
from app.models.hospital import Hospital
from app.models.cooling import CoolingCenter
from app.schemas.government_schemas import (
    HighRiskAreaOut,
    HospitalCapacitySummaryOut,
    CoolingCapacitySummaryOut,
    DistrictOverviewOut,
    StateOverviewOut,
)


def _latest_htsi_by_ward(db: Session, ward_ids: list[int]) -> dict[int, ThermalStressRecord]:
    if not ward_ids:
        return {}
    subq = (
        select(ThermalStressRecord)
        .where(ThermalStressRecord.ward_id.in_(ward_ids))
        .order_by(ThermalStressRecord.ward_id, desc(ThermalStressRecord.recorded_at))
        .distinct(ThermalStressRecord.ward_id)
    )
    rows = db.execute(subq).scalars().all()
    return {r.ward_id: r for r in rows}


def _severity_from_avg(avg_score: float) -> str:
    if avg_score < 30:
        return "Safe"
    if avg_score < 55:
        return "Caution"
    if avg_score < 80:
        return "Danger"
    return "Extreme Danger"


def _emergency_recommendations(severity: str, high_risk_count: int) -> list[str]:
    recs = []
    if severity in ("Danger", "Extreme Danger"):
        recs.append("Activate district heat-action plan and open additional cooling centers.")
        recs.append("Pre-position ambulances and ICU surge staff near highest-risk wards.")
        recs.append("Issue public advisory restricting outdoor labor between 12pm-4pm.")
    if severity == "Extreme Danger":
        recs.append("Escalate to State Disaster Management Authority for emergency resource support.")
    if high_risk_count >= 3:
        recs.append(f"{high_risk_count} wards are in Danger/Extreme Danger — prioritize door-to-door outreach there.")
    if not recs:
        recs.append("Conditions are within manageable limits. Continue routine monitoring.")
    return recs


def build_district_overview(db: Session, district: District) -> DistrictOverviewOut:
    wards = db.query(Ward).filter(Ward.district_id == district.id).all()
    ward_ids = [w.id for w in wards]
    htsi_by_ward = _latest_htsi_by_ward(db, ward_ids)

    scores = [htsi_by_ward[w.id].htsi_score for w in wards if w.id in htsi_by_ward]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    severity = _severity_from_avg(avg_score)

    high_risk_areas = []
    for w in wards:
        record = htsi_by_ward.get(w.id)
        if record and record.htsi_score >= 55:
            high_risk_areas.append(
                HighRiskAreaOut(
                    ward_id=w.id,
                    ward_name=w.name,
                    htsi_score=record.htsi_score,
                    severity=record.htsi_category,
                    population=w.population,
                    elderly_population_pct=w.elderly_population_pct,
                )
            )
    high_risk_areas.sort(key=lambda a: a.htsi_score, reverse=True)

    vulnerable_population = sum(
        int(w.population * (w.elderly_population_pct + 0.05)) for w in wards
    )

    hospitals = db.query(Hospital).filter(Hospital.ward_id.in_(ward_ids)).all() if ward_ids else []
    total_beds = sum(h.total_beds for h in hospitals)
    available_beds = sum(h.available_beds for h in hospitals)
    total_icu = sum(h.icu_beds for h in hospitals)
    available_icu = sum(h.available_icu_beds for h in hospitals)
    hospital_summary = HospitalCapacitySummaryOut(
        total_hospitals=len(hospitals),
        total_beds=total_beds,
        available_beds=available_beds,
        total_icu_beds=total_icu,
        available_icu_beds=available_icu,
        overall_utilization_pct=round(
            (1 - available_beds / total_beds) * 100 if total_beds else 0.0, 1
        ),
    )

    centers = db.query(CoolingCenter).filter(CoolingCenter.ward_id.in_(ward_ids)).all() if ward_ids else []
    total_capacity = sum(c.capacity for c in centers)
    total_occupancy = sum(c.current_occupancy for c in centers)
    cooling_summary = CoolingCapacitySummaryOut(
        total_centers=len(centers),
        total_capacity=total_capacity,
        total_occupancy=total_occupancy,
        utilization_pct=round((total_occupancy / total_capacity) * 100 if total_capacity else 0.0, 1),
    )

    return DistrictOverviewOut(
        district_id=district.id,
        district_name=district.name,
        state_name=district.state,
        heatwave_severity=severity,
        average_htsi_score=avg_score,
        high_risk_areas=high_risk_areas,
        vulnerable_population_estimate=vulnerable_population,
        hospital_capacity=hospital_summary,
        cooling_center_capacity=cooling_summary,
        emergency_recommendations=_emergency_recommendations(severity, len(high_risk_areas)),
    )


def build_state_overview(db: Session, state: State) -> StateOverviewOut:
    districts = db.query(District).filter(District.state_id == state.id).all()
    summaries = [build_district_overview(db, d) for d in districts]
    avg = round(sum(s.average_htsi_score for s in summaries) / len(summaries), 1) if summaries else 0.0
    total_vulnerable = sum(s.vulnerable_population_estimate for s in summaries)
    return StateOverviewOut(
        state_id=state.id,
        state_name=state.name,
        district_summaries=summaries,
        statewide_average_htsi=avg,
        total_vulnerable_population=total_vulnerable,
    )
