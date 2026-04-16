import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LiveMetrics from '../components/LiveMetrics'
import type { TelemetryPacket } from '../types/telemetry'

const mockPacket: TelemetryPacket = {
  satellite_id: 'SAT-0001',
  timestamp: '2024-01-01T00:00:00Z',
  latitude: 45.5,
  longitude: -93.1,
  altitude_km: 550.0,
  velocity_km_s: 7.66,
  signal_strength_dbm: -85.0,
  battery_voltage: 8.2,
  temperature_c: 21.3,
  mode: 'NOMINAL',
}

describe('LiveMetrics', () => {
  it('renders "Awaiting telemetry" when no data is available', () => {
    render(<LiveMetrics latest={null} status="connecting" />)
    expect(screen.getByText(/awaiting telemetry/i)).toBeInTheDocument()
  })

  it('renders satellite ID when packet is provided', () => {
    render(<LiveMetrics latest={mockPacket} status="connected" />)
    expect(screen.getByText('SAT-0001')).toBeInTheDocument()
  })

  it('renders altitude value', () => {
    render(<LiveMetrics latest={mockPacket} status="connected" />)
    expect(screen.getByText('550.0')).toBeInTheDocument()
  })

  it('renders NOMINAL mode badge', () => {
    render(<LiveMetrics latest={mockPacket} status="connected" />)
    expect(screen.getByText('NOMINAL')).toBeInTheDocument()
  })

  it('shows CONNECTED status', () => {
    render(<LiveMetrics latest={mockPacket} status="connected" />)
    expect(screen.getByText(/connected/i)).toBeInTheDocument()
  })
})
