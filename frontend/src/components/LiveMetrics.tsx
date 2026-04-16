import React from 'react'
import type { TelemetryPacket } from '../types/telemetry'
import type { ConnectionStatus } from '../hooks/useTelemetryStream'

interface LiveMetricsProps {
  latest: TelemetryPacket | null
  status: ConnectionStatus
}

const hudStyle: React.CSSProperties = {
  background: 'rgba(10, 20, 40, 0.85)',
  border: '1px solid rgba(0, 217, 255, 0.2)',
  borderRadius: 12,
  padding: '16px 20px',
}

const titleStyle: React.CSSProperties = {
  color: '#7ecfff',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
}

const metricStyle: React.CSSProperties = {
  background: 'rgba(0, 217, 255, 0.05)',
  border: '1px solid rgba(0, 217, 255, 0.15)',
  borderRadius: 8,
  padding: '10px 14px',
}

const metricLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#4a7a9b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 4,
}

const metricValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#e0f4ff',
  lineHeight: 1.1,
}

const metricUnitStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#6a9ab8',
  marginLeft: 4,
}

const statusDotStyle = (status: ConnectionStatus): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: status === 'connected' ? '#00ff88' : status === 'connecting' ? '#ffcc00' : '#ff4455',
  display: 'inline-block',
})

const modeBadgeStyle = (mode: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  background: mode === 'NOMINAL' ? 'rgba(0,255,136,0.15)' : mode === 'FAULT' ? 'rgba(255,68,85,0.2)' : 'rgba(255,204,0,0.15)',
  color: mode === 'NOMINAL' ? '#00ff88' : mode === 'FAULT' ? '#ff4455' : '#ffcc00',
  border: `1px solid ${mode === 'NOMINAL' ? '#00ff8840' : mode === 'FAULT' ? '#ff445540' : '#ffcc0040'}`,
})

export default function LiveMetrics({ latest, status }: LiveMetricsProps) {
  return (
    <div style={hudStyle}>
      <div style={titleStyle}>
        <span style={statusDotStyle(status)} />
        Live HUD — {status.toUpperCase()}
        {latest && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4a7a9b', textTransform: 'none', letterSpacing: 0 }}>
            {latest.satellite_id}
          </span>
        )}
      </div>

      {latest ? (
        <>
          <div style={gridStyle}>
            <Metric label="Altitude" value={latest.altitude_km.toFixed(1)} unit="km" />
            <Metric label="Velocity" value={latest.velocity_km_s.toFixed(2)} unit="km/s" />
            <Metric label="Signal" value={latest.signal_strength_dbm.toFixed(1)} unit="dBm" />
            <Metric label="Battery" value={latest.battery_voltage.toFixed(2)} unit="V" />
            <Metric label="Temp" value={latest.temperature_c.toFixed(1)} unit="°C" />
            <Metric label="Latitude" value={latest.latitude.toFixed(3)} unit="°" />
            <Metric label="Longitude" value={latest.longitude.toFixed(3)} unit="°" />
            <div style={metricStyle}>
              <div style={metricLabelStyle}>Mode</div>
              <div style={metricValueStyle}>
                <span style={modeBadgeStyle(latest.mode)}>{latest.mode}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: '#4a6fa5', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
          Awaiting telemetry…
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={metricStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>
        {value}
        <span style={metricUnitStyle}>{unit}</span>
      </div>
    </div>
  )
}
