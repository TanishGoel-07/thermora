from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.geography import District, State
from app.models.user import UserRole
from app.core.security import require_roles
from app.schemas.government_schemas import DistrictOverviewOut, StateOverviewOut
from app.services.government_dashboard import build_district_overview, build_state_overview

router = APIRouter(prefix="/government", tags=["government"])

OFFICER_ROLES = (UserRole.DISTRICT_OFFICER, UserRole.STATE_OFFICER, UserRole.SUPER_ADMIN)


@router.get(
    "/district/{district_id}/overview",
    response_model=DistrictOverviewOut,
    dependencies=[Depends(require_roles(*OFFICER_ROLES))],
)
def get_district_overview(district_id: int, db: Session = Depends(get_db)):
    """
    Powers the District Magistrate / Municipal Corporation dashboard:
    heatwave severity, high-risk wards, vulnerable population estimate,
    hospital capacity, cooling-center capacity, and emergency recommendations.
    """
    district = db.get(District, district_id)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return build_district_overview(db, district)


@router.get(
    "/state/{state_id}/overview",
    response_model=StateOverviewOut,
    dependencies=[Depends(require_roles(UserRole.STATE_OFFICER, UserRole.SUPER_ADMIN))],
)
def get_state_overview(state_id: int, db: Session = Depends(get_db)):
    """
    Powers the State Disaster Management Authority dashboard: rolls up every
    district's overview for statewide situational awareness.
    """
    state = db.get(State, state_id)
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return build_state_overview(db, state)
