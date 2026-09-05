from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.geography import District, Ward
from app.schemas.schemas import DistrictOut, WardOut

router = APIRouter(prefix="/geo", tags=["geography"])


@router.get("/districts", response_model=list[DistrictOut])
def list_districts(db: Session = Depends(get_db)):
    return db.query(District).all()


@router.get("/wards", response_model=list[WardOut])
def list_wards(district_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Ward)
    if district_id is not None:
        query = query.filter(Ward.district_id == district_id)
    return query.all()


@router.get("/wards/{ward_id}", response_model=WardOut)
def get_ward(ward_id: int, db: Session = Depends(get_db)):
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    return ward
