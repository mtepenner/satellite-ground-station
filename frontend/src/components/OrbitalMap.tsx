import React, { useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps'
import type { TelemetryPacket } from '../types/telemetry'

interface OrbitalMapProps {
  packets: TelemetryPacket[]
  latest: TelemetryPacket | null
}

// Natural Earth GeoJSON from public CDN
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const containerStyle: React.CSSProperties = {
  width: '100%',
  background: '#050a14',
  borderRadius: 12,
  overflow: 'hidden',
  position: 'relative',
}

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 16,
  color: '#7ecfff',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  pointerEvents: 'none',
  zIndex: 10,
}

const countStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 16,
  color: '#4a7a9b',
  fontSize: 11,
  pointerEvents: 'none',
  zIndex: 10,
}

/**
 * OrbitalMap renders an interactive SVG world map (Robinson projection) that
 * plots the ground-track of the satellite using the last 50 telemetry packets.
 * The most recent position is highlighted in a contrasting colour.
 */
export default function OrbitalMap({ packets, latest }: OrbitalMapProps) {
  const trail = useMemo(() => packets.slice(-50), [packets])

  // Build [lon, lat] pairs for the ground-track polyline
  const lineCoordinates = useMemo(
    () => trail.map(p => [p.longitude, p.latitude] as [number, number]),
    [trail]
  )

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>Orbital Map</div>
      <div style={countStyle}>{packets.length} points</div>

      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 145 }}
        style={{ width: '100%', height: '420px' }}
      >
        {/* Base map */}
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
            geographies.map((geo: { rsmKey: string }) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0d2240"
                stroke="#1a4070"
                strokeWidth={0.4}
                style={{
                  default: { outline: 'none' },
                  hover: { fill: '#112a50', outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Ground track polyline */}
        {lineCoordinates.length >= 2 && (
          <Line
            coordinates={lineCoordinates}
            stroke="#00d9ff"
            strokeWidth={1.5}
            strokeOpacity={0.6}
            strokeLinecap="round"
          />
        )}

        {/* Historical position dots */}
        {trail.slice(0, -1).map((p, i) => (
          <Marker key={i} coordinates={[p.longitude, p.latitude]}>
            <circle r={2} fill="#00d9ff" fillOpacity={0.4} />
          </Marker>
        ))}

        {/* Live satellite position */}
        {latest && (
          <Marker coordinates={[latest.longitude, latest.latitude]}>
            <circle r={6} fill="#ff6b35" stroke="#ffffff" strokeWidth={1.5} />
            <circle r={12} fill="none" stroke="#ff6b35" strokeWidth={1} strokeOpacity={0.4} />
            <text
              textAnchor="start"
              x={14}
              y={4}
              style={{ fontSize: 10, fill: '#ff6b35', fontWeight: 700 }}
            >
              {latest.satellite_id}
            </text>
          </Marker>
        )}
      </ComposableMap>
    </div>
  )
}
