from datetime import datetime
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.telemetry import TelemetryRecord
from app.schemas.telemetry_schema import TelemetryRead


class TelemetryService:
    """Middle-tier service encapsulating telemetry database queries and
    aggregations.  All methods are async-safe for use with FastAPI."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_telemetry(
        self,
        satellite_id: Optional[str] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[TelemetryRead]:
        stmt = select(TelemetryRecord).order_by(TelemetryRecord.timestamp.desc())

        if satellite_id:
            stmt = stmt.where(TelemetryRecord.satellite_id == satellite_id)
        if start:
            stmt = stmt.where(TelemetryRecord.timestamp >= start)
        if end:
            stmt = stmt.where(TelemetryRecord.timestamp <= end)

        stmt = stmt.limit(limit).offset(offset)
        result = await self._db.execute(stmt)
        rows = result.scalars().all()
        return [TelemetryRead.model_validate(r) for r in rows]

    async def get_by_id(self, record_id: int) -> Optional[TelemetryRead]:
        result = await self._db.execute(
            select(TelemetryRecord).where(TelemetryRecord.id == record_id)
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return TelemetryRead.model_validate(row)

    async def list_satellite_ids(self) -> List[str]:
        result = await self._db.execute(
            select(func.distinct(TelemetryRecord.satellite_id)).order_by(
                TelemetryRecord.satellite_id
            )
        )
        return list(result.scalars().all())

    async def get_latest(self, satellite_id: str) -> Optional[TelemetryRead]:
        """Return the most recent telemetry record for a given satellite."""
        result = await self._db.execute(
            select(TelemetryRecord)
            .where(TelemetryRecord.satellite_id == satellite_id)
            .order_by(TelemetryRecord.timestamp.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return TelemetryRead.model_validate(row)
