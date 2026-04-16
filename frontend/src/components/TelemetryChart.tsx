import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TelemetryPacket } from '../types/telemetry'
import type { TelemetryRecord } from '../services/api'

interface TelemetryChartProps {
  livePackets: TelemetryPacket[]
  historicalData: TelemetryRecord[]
}

type MetricKey = 'altitude_km' | 'velocity_km_s' | 'signal_strength_dbm' | 'battery_voltage' | 'temperature_c'

interface ChartDatum {
  time: string
  altitude_km: number
  velocity_km_s: number
  signal_strength_dbm: number
  battery_voltage: number
  temperature_c: number
}

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'altitude_km',         label: 'Altitude (km)',       color: '#00d9ff' },
  { key: 'velocity_km_s',       label: 'Velocity (km/s)',     color: '#ff6b35' },
  { key: 'signal_strength_dbm', label: 'Signal (dBm)',        color: '#a259ff' },
  { key: 'battery_voltage',     label: 'Battery (V)',         color: '#00ff88' },
  { key: 'temperature_c',       label: 'Temperature (°C)',    color: '#ffcc00' },
]

const containerStyle: React.CSSProperties = {
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
}

const tabRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 12,
  flexWrap: 'wrap',
}

function toChartDatum(p: TelemetryPacket | TelemetryRecord): ChartDatum {
  const ts = p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : '–'
  return {
    time: ts,
    altitude_km: p.altitude_km,
    velocity_km_s: p.velocity_km_s,
    signal_strength_dbm: p.signal_strength_dbm,
    battery_voltage: p.battery_voltage,
    temperature_c: p.temperature_c,
  }
}

export default function TelemetryChart({ livePackets, historicalData }: TelemetryChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('altitude_km')
  const [chartData, setChartData] = useState<ChartDatum[]>([])

  useEffect(() => {
    const historical = historicalData.slice().reverse().map(toChartDatum)
    const live = livePackets.map(toChartDatum)
    const combined = [...historical, ...live].slice(-100)
    setChartData(combined)
  }, [livePackets, historicalData])

  const metric = METRICS.find(m => m.key === activeMetric)!

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Telemetry Chart</div>
      <div style={tabRowStyle}>
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${m.color}50`,
              background: activeMetric === m.key ? `${m.color}22` : 'transparent',
              color: activeMetric === m.key ? m.color : '#4a7a9b',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: activeMetric === m.key ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="time" tick={{ fill: '#4a7a9b', fontSize: 10 }} />
          <YAxis tick={{ fill: '#4a7a9b', fontSize: 10 }} width={55} />
          <Tooltip
            contentStyle={{ background: '#0a1422', border: '1px solid #1a3a5c', borderRadius: 8 }}
            labelStyle={{ color: '#7ecfff' }}
            itemStyle={{ color: metric.color }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#4a7a9b' }} />
          <Line
            type="monotone"
            dataKey={activeMetric}
            name={metric.label}
            stroke={metric.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
