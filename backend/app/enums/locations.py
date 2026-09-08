"""
Predefined location enums and mappings.

Currently limited to Maharashtra. Additional states and their districts
can be added to IndianState and STATE_DISTRICT_MAP when needed.
"""

from enum import Enum


class IndianState(str, Enum):
    MAHARASHTRA = "Maharashtra"


# All 36 districts of Maharashtra
MAHARASHTRA_DISTRICTS: list[str] = [
    "Ahmednagar",
    "Akola",
    "Amravati",
    "Aurangabad",
    "Beed",
    "Bhandara",
    "Buldhana",
    "Chandrapur",
    "Dhule",
    "Gadchiroli",
    "Gondia",
    "Hingoli",
    "Jalgaon",
    "Jalna",
    "Kolhapur",
    "Latur",
    "Mumbai City",
    "Mumbai Suburban",
    "Nagpur",
    "Nanded",
    "Nandurbar",
    "Nashik",
    "Osmanabad",
    "Palghar",
    "Parbhani",
    "Pune",
    "Raigad",
    "Ratnagiri",
    "Sangli",
    "Satara",
    "Sindhudurg",
    "Solapur",
    "Thane",
    "Wardha",
    "Washim",
    "Yavatmal",
]

# Map each state to its list of valid districts.
# Expand this dict when more states are supported.
STATE_DISTRICT_MAP: dict[str, list[str]] = {
    IndianState.MAHARASHTRA.value: MAHARASHTRA_DISTRICTS,
}


def get_districts_for_state(state: str) -> list[str]:
    """Return the list of valid districts for the given state name."""
    return STATE_DISTRICT_MAP.get(state, [])


def is_valid_district_for_state(state: str, district: str) -> bool:
    """Check whether *district* is a recognised district of *state*."""
    return district in STATE_DISTRICT_MAP.get(state, [])
