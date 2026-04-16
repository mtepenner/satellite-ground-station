import { useState, useEffect, useRef, useCallback } from 'react'
import type { TelemetryPacket } from '../types/telemetry'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws/telemetry'
const MAX_HISTORY = 200
const RECONNECT_DELAY_MS = 3000

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface TelemetryStreamState {
  latest: TelemetryPacket | null
  history: TelemetryPacket[]
  status: ConnectionStatus
}

/**
 * Manages a WebSocket connection to the ground-station backend and maintains
 * a rolling window of the most recent telemetry packets.
 */
export function useTelemetryStream(): TelemetryStreamState {
  const [latest, setLatest] = useState<TelemetryPacket | null>(null)
  const [history, setHistory] = useState<TelemetryPacket[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    setStatus('connecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setStatus('connected')
    }

    ws.onmessage = (event: MessageEvent<string>) => {
      if (!mountedRef.current) return
      try {
        const packet: TelemetryPacket = JSON.parse(event.data)
        setLatest(packet)
        setHistory(prev => {
          const next = [...prev, packet]
          return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
        })
      } catch {
        // Silently discard malformed packets
      }
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      setStatus('error')
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setStatus('disconnected')
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { latest, history, status }
}
