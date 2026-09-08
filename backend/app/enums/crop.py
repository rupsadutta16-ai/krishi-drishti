"""
Crop-related enums for Crop types, Growth stages, and Rice varieties.
"""

from enum import Enum


class CropType(str, Enum):
    RICE = "Rice"
    COTTON = "Cotton"
    WHEAT = "Wheat"
    SOYBEAN = "Soybean"
    TOMATO = "Tomato"
    MAIZE = "Maize"
    SUGARCANE = "Sugarcane"
    PULSES = "Pulses"
    OTHER = "Other"


class RiceVariety(str, Enum):
    BASMATI = "Basmati"
    SONA_MASOORI = "Sona Masoori"
    IR64 = "IR64"
    SWARNA = "Swarna"
    PONNI = "Ponni"
    PR126 = "PR126"
    INDRAYANI = "Indrayani"
    BLACK_RICE = "Black Rice"
    JASMINE = "Jasmine"
    OTHER = "Other"


class GrowthStage(str, Enum):
    SOWING = "Sowing"
    GERMINATION = "Germination"
    VEGETATIVE = "Vegetative"
    FLOWERING = "Flowering"
    FRUITING = "Fruiting"
    HARVESTING = "Harvesting"
    COMPLETED = "Completed"
