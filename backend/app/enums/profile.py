"""
Predefined profile-related enums.

These enums are the single source of truth — the same values are
used by Pydantic schemas for validation and returned by the
/options/profile-fields API so the frontend can build dropdowns.
"""

from enum import Enum


# ─── Languages ────────────────────────────────────────────────────
class SupportedLanguage(str, Enum):
    ENGLISH = "en"
    HINDI = "hi"
    MARATHI = "mr"


# ─── Expert specializations ──────────────────────────────────────
class ExpertSpecialization(str, Enum):
    PLANT_PATHOLOGY = "Plant Pathology"
    ENTOMOLOGY = "Entomology"
    AGRONOMY = "Agronomy"
    HORTICULTURE = "Horticulture"
    SOIL_SCIENCE = "Soil Science"
    CROP_PROTECTION = "Crop Protection"
    AGRICULTURAL_EXTENSION = "Agricultural Extension"
    WEED_SCIENCE = "Weed Science"
    AGRICULTURAL_BIOTECHNOLOGY = "Agricultural Biotechnology & Seed Tech"


# ─── Official departments ────────────────────────────────────────
class OfficialDepartment(str, Enum):
    AGRICULTURE_WELFARE = "Department of Agriculture & Farmers Welfare"
    HORTICULTURE = "Department of Horticulture"
    PLANT_PROTECTION = "Department of Plant Protection & Quarantine"
    AGRICULTURAL_MARKETING = "Department of Agricultural Marketing"
    EXTENSION_SERVICES = "State Agricultural Extension Services"
    KVK = "Krishi Vigyan Kendra (KVK)"
    REVENUE_DISASTER = "Revenue & Disaster Management"


# ─── Official designations ───────────────────────────────────────
class OfficialDesignation(str, Enum):
    DAO = "District Agriculture Officer (DAO)"
    SDAO = "Sub-Divisional Agriculture Officer (SDAO)"
    TAO = "Taluka Agriculture Officer (TAO)"
    AEO = "Agriculture Extension Officer (AEO)"
    HDO = "Horticultural Development Officer (HDO)"
    PPO = "Plant Protection Officer (PPO)"
    ADA = "Assistant Director of Agriculture (ADA)"
    JDA = "Joint Director of Agriculture (JDA)"
    AFO = "Agricultural Field Officer (AFO)"
