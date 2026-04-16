"""Tests for the Pydantic telemetry schemas."""
import pytest
from datetime import datetime, timezone
from app.schemas.telemetry_schema import TelemetryCreate, TelemetryLive, TelemetryQuery


def _valid_payload(**overrides) -> dict:
    base = {
        "satellite_id": "SAT-0001",
        "latitude": 45.5,
        "longitude": -93.1,
        "altitude_km": 550.0,
        "velocity_km_s": 7.66,
        "signal_strength_dbm": -85.0,
        "battery_voltage": 8.2,
        "temperature_c": 21.3,
        "mode": "NOMINAL",
        "timestamp": datetime(2024, 1, 1, tzinfo=timezone.utc),
    }
    base.update(overrides)
    return base


def test_telemetry_create_valid():
    record = TelemetryCreate(**_valid_payload())
    assert record.satellite_id == "SAT-0001"
    assert record.mode == "NOMINAL"


def test_telemetry_create_invalid_latitude():
    with pytest.raises(Exception):
        TelemetryCreate(**_valid_payload(latitude=999))


def test_telemetry_create_invalid_longitude():
    with pytest.raises(Exception):
        TelemetryCreate(**_valid_payload(longitude=-999))


def test_telemetry_live_no_timestamp():
    payload = _valid_payload()
    payload.pop("timestamp")
    live = TelemetryLive(**payload)
    assert live.timestamp is None


def test_telemetry_query_defaults():
    q = TelemetryQuery()
    assert q.limit == 100
    assert q.offset == 0
    assert q.satellite_id is None


def test_telemetry_query_limit_capped():
    with pytest.raises(Exception):
        TelemetryQuery(limit=99999)
