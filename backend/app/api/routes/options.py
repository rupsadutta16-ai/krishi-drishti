"""
Public API that returns all predefined dropdown/select options.

Frontend clients fetch this once on load so that dropdowns are populated
with the exact same values the backend validates against.
"""

from fastapi import APIRouter

from app.enums.locations import IndianState, STATE_DISTRICT_MAP
from app.enums.profile import (
    SupportedLanguage,
    ExpertSpecialization,
    OfficialDepartment,
    OfficialDesignation,
)

router = APIRouter(prefix="/options", tags=["Options"])


@router.get("/profile-fields")
def get_profile_field_options():
    """Return every predefined allowed value for profile form dropdowns."""
    return {
        "states": [
            {"value": s.value, "label": s.value} for s in IndianState
        ],
        "districts": {
            state: districts
            for state, districts in STATE_DISTRICT_MAP.items()
        },
        "languages": [
            {"value": lang.value, "label": lang.name.title()}
            for lang in SupportedLanguage
        ],
        "specializations": [
            {"value": s.value, "label": s.value}
            for s in ExpertSpecialization
        ],
        "departments": [
            {"value": d.value, "label": d.value}
            for d in OfficialDepartment
        ],
        "designations": [
            {"value": d.value, "label": d.value}
            for d in OfficialDesignation
        ],
    }
