from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.schemas.telemetry_schema import TelemetryRead
from app.services.data_processor import TelemetryService

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.get("/", response_model=List[TelemetryRead], summary="List historical telemetry")
async def list_telemetry(
    satellite_id: Optional[str] = Query(None, description="Filter by satellite ID"),
    start: Optional[datetime] = Query(None, description="Start of time range (ISO 8601)"),
    end: Optional[datetime] = Query(None, description="End of time range (ISO 8601)"),
    limit: int = Query(100, ge=1, le=10_000, description="Maximum records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: AsyncSession = Depends(get_db),
) -> List[TelemetryRead]:
    """Return historical telemetry records with optional filters."""
    service = TelemetryService(db)
    records = await service.get_telemetry(
        satellite_id=satellite_id,
        start=start,
        end=end,
        limit=limit,
        offset=offset,
    )
    return records


@router.get(
    "/{record_id}",
    response_model=TelemetryRead,
    summary="Get a single telemetry record by ID",
)
async def get_telemetry_by_id(
    record_id: int,
    db: AsyncSession = Depends(get_db),
) -> TelemetryRead:
    """Return a single telemetry record by its primary key."""
    service = TelemetryService(db)
    record = await service.get_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Telemetry record {record_id} not found")
    return record


@router.get(
    "/satellites/list",
    response_model=List[str],
    summary="List all known satellite IDs",
)
async def list_satellites(db: AsyncSession = Depends(get_db)) -> List[str]:
    """Return a sorted list of unique satellite IDs present in the database."""
    service = TelemetryService(db)
    return await service.list_satellite_ids()
