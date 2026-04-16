from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TelemetryBase(BaseModel):
    """Shared fields for all telemetry representations."""

    satellite_id: str = Field(..., max_length=32, description="Unique satellite identifier")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Degrees latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Degrees longitude")
    altitude_km: float = Field(..., ge=0.0, description="Altitude in kilometres")
    velocity_km_s: float = Field(..., ge=0.0, description="Velocity in km/s")
    signal_strength_dbm: float = Field(..., description="Received signal strength in dBm")
    battery_voltage: float = Field(..., ge=0.0, description="Bus voltage in volts")
    temperature_c: float = Field(..., description="Spacecraft body temperature in °C")
    mode: str = Field(default="NOMINAL", max_length=32, description="Operational mode string")


class TelemetryCreate(TelemetryBase):
    """Schema for persisting a new telemetry record.  Timestamp is required."""

    timestamp: datetime


class TelemetryRead(TelemetryBase):
    """Schema returned to API consumers.  Includes DB-assigned id and timestamp."""

    id: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class TelemetryLive(TelemetryBase):
    """Schema for live WebSocket messages (no DB id, timestamp is optional)."""

    timestamp: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TelemetryQuery(BaseModel):
    """Query parameters for filtering historical telemetry."""

    satellite_id: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    limit: int = Field(default=100, ge=1, le=10_000)
    offset: int = Field(default=0, ge=0)
