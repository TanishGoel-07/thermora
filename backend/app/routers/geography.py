from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.geography import State, District, Ward
from app.schemas.schemas import StateOut, DistrictOut, WardOut
from app.core.cache import cache_response

router = APIRouter(prefix="/geo", tags=["geography"])


@router.get("/states", response_model=list[StateOut])
@cache_response(ttl_seconds=3600, key="geo:states")
def list_states(db: Session = Depends(get_db)):
    """Top of the location hierarchy. Drives the state selector in the topbar."""
    return db.query(State).order_by(State.name).all()


@router.get("/states/{state_id}", response_model=StateOut)
def get_state(state_id: int, db: Session = Depends(get_db)):
    state = db.get(State, state_id)
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return state


@router.get("/districts", response_model=list[DistrictOut])
@cache_response(ttl_seconds=1800, key="geo:districts")
def list_districts(state_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(District)
    if state_id is not None:
        query = query.filter(District.state_id == state_id)
    return query.order_by(District.name).all()


@router.get("/districts/{district_id}", response_model=DistrictOut)
def get_district(district_id: int, db: Session = Depends(get_db)):
    district = db.get(District, district_id)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return district


@router.get("/wards", response_model=list[WardOut])
def list_wards(district_id: int | None = None, state_id: int | None = None, db: Session = Depends(get_db)):
    """
    Fully dynamic — no ward is hardcoded anywhere. Pass district_id to scope
    to one district, or state_id to list every ward across that state.
    """
    query = db.query(Ward)
    if district_id is not None:
        query = query.filter(Ward.district_id == district_id)
    elif state_id is not None:
        query = query.join(District).filter(District.state_id == state_id)
    return query.order_by(Ward.name).all()


@router.get("/wards/{ward_id}", response_model=WardOut)
def get_ward(ward_id: int, db: Session = Depends(get_db)):
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    return ward
