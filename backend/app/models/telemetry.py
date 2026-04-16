from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TelemetryRecord(Base):
    """Maps to the `telemetry` hypertable in TimescaleDB.

    TimescaleDB automatically partitions rows by the `timestamp` column once
    the hypertable is created via:
        SELECT create_hypertable('telemetry', 'timestamp');
    """

    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    satellite_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    # Orbital state
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    altitude_km: Mapped[float] = mapped_column(Float, nullable=False)
    velocity_km_s: Mapped[float] = mapped_column(Float, nullable=False)

    # RF / power telemetry
    signal_strength_dbm: Mapped[float] = mapped_column(Float, nullable=False)
    battery_voltage: Mapped[float] = mapped_column(Float, nullable=False)
    temperature_c: Mapped[float] = mapped_column(Float, nullable=False)

    # Spacecraft state
    mode: Mapped[str] = mapped_column(String(32), nullable=False, default="NOMINAL")

    __table_args__ = (
        Index("ix_telemetry_satellite_timestamp", "satellite_id", "timestamp"),
    )

    def __repr__(self) -> str:
        return (
            f"<TelemetryRecord id={self.id} sat={self.satellite_id} "
            f"ts={self.timestamp} mode={self.mode}>"
        )
