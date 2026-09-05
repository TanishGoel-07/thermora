from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.hospital import Hospital, HospitalPrediction
from app.models.geography import Ward
from app.models.thermal import ThermalStressRecord
from app.schemas.schemas import HospitalOut, HospitalPredictionOut
from app.services.hospital_surge import predict_hospital_surge

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


@router.get("", response_model=list[HospitalOut])
def list_hospitals(ward_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Hospital)
    if ward_id is not None:
        query = query.filter(Hospital.ward_id == ward_id)
    return query.all()


@router.get("/surge-predictions", response_model=list[HospitalPredictionOut])
def get_surge_predictions(ward_id: int | None = None, db: Session = Depends(get_db)):
    hospitals_query = db.query(Hospital)
    if ward_id is not None:
        hospitals_query = hospitals_query.filter(Hospital.ward_id == ward_id)
    hospitals = hospitals_query.all()

    results = []
    for hospital in hospitals:
        ward = db.get(Ward, hospital.ward_id)
        if not ward:
            continue
        latest_thermal = (
            db.execute(
                select(ThermalStressRecord)
                .where(ThermalStressRecord.ward_id == ward.id)
                .order_by(desc(ThermalStressRecord.recorded_at))
                .limit(1)
            )
            .scalars()
            .first()
        )
        htsi_score = latest_thermal.htsi_score if latest_thermal else 40.0

        surge = predict_hospital_surge(ward, hospital, htsi_score)

        prediction = HospitalPrediction(
            hospital_id=hospital.id,
            ward_id=ward.id,
            predicted_for_date=datetime.utcnow(),
            expected_heat_stroke_cases=surge["expected_heat_stroke_cases"],
            expected_admissions=surge["expected_admissions"],
            expected_icu_requirement=surge["expected_icu_requirement"],
            surge_risk_level=surge["surge_risk_level"],
            capacity_utilization_pct=surge["capacity_utilization_pct"],
        )
        db.add(prediction)

        results.append(
            HospitalPredictionOut(
                hospital_id=hospital.id,
                hospital_name=hospital.name,
                predicted_for_date=prediction.predicted_for_date,
                **surge,
            )
        )
    db.commit()
    return results
