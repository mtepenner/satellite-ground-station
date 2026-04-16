import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTelemetryStream } from '../hooks/useTelemetryStream'

// Minimal WebSocket mock
class MockWebSocket {
  static instances: MockWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  readyState = 0

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
    setTimeout(() => {
      this.readyState = 1
      this.onopen?.()
    }, 0)
  }
  close() {
    this.onclose?.()
  }
  simulateMessage(data: string) {
    this.onmessage?.({ data })
  }
  simulateError() {
    this.onerror?.()
  }
}

describe('useTelemetryStream', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with connecting status', () => {
    const { result } = renderHook(() => useTelemetryStream())
    expect(result.current.status).toBe('connecting')
    expect(result.current.latest).toBeNull()
    expect(result.current.history).toHaveLength(0)
  })

  it('transitions to connected on WebSocket open', async () => {
    const { result } = renderHook(() => useTelemetryStream())
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })
    expect(result.current.status).toBe('connected')
  })

  it('parses incoming telemetry messages', async () => {
    const { result } = renderHook(() => useTelemetryStream())
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })
    const ws = MockWebSocket.instances[0]
    const packet = {
      satellite_id: 'SAT-0001',
      latitude: 45.5,
      longitude: -93.1,
      altitude_km: 550,
      velocity_km_s: 7.66,
      signal_strength_dbm: -85,
      battery_voltage: 8.2,
      temperature_c: 21.3,
      mode: 'NOMINAL',
      timestamp: null,
    }
    act(() => {
      ws.simulateMessage(JSON.stringify(packet))
    })
    expect(result.current.latest?.satellite_id).toBe('SAT-0001')
    expect(result.current.history).toHaveLength(1)
  })

  it('ignores malformed JSON messages', async () => {
    const { result } = renderHook(() => useTelemetryStream())
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })
    const ws = MockWebSocket.instances[0]
    act(() => {
      ws.simulateMessage('not valid json {{{}')
    })
    expect(result.current.latest).toBeNull()
    expect(result.current.history).toHaveLength(0)
  })
})
