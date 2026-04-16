import React, { useEffect, useState } from 'react'
import OrbitalMap from '../components/OrbitalMap'
import LiveMetrics from '../components/LiveMetrics'
import TelemetryChart from '../components/TelemetryChart'
import { useTelemetryStream } from '../hooks/useTelemetryStream'
import { api } from '../services/api'
import type { TelemetryRecord } from '../services/api'

const pageStyle: React.CSSProperties = {
  padding: '20px 24px',
  maxWidth: 1600,
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 24,
}

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: '#e0f4ff',
  letterSpacing: '0.04em',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#4a7a9b',
  marginTop: 2,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 360px',
  gridTemplateRows: 'auto auto',
  gap: 16,
}

const fullRowStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
}

export default function Dashboard() {
  const { latest, history, status } = useTelemetryStream()
  const [historical, setHistorical] = useState<TelemetryRecord[]>([])

  useEffect(() => {
    api.getTelemetry({ limit: 100 })
      .then(setHistorical)
      .catch(() => { /* backend may not be reachable in dev without full stack */ })
  }, [])

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>📡 Satellite Ground Station</div>
          <div style={subtitleStyle}>
            Live telemetry dashboard — {history.length} packets received
          </div>
        </div>
      </div>

      <div style={gridStyle}>
        {/* Left column: 3D globe */}
        <OrbitalMap packets={history} latest={latest} />

        {/* Right column: live HUD */}
        <LiveMetrics latest={latest} status={status} />

        {/* Bottom full-width: time-series chart */}
        <div style={fullRowStyle}>
          <TelemetryChart livePackets={history} historicalData={historical} />
        </div>
      </div>
    </div>
  )
}
